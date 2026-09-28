#!/usr/bin/env ruby
# One-time T07 calibration, deliberately separate from the test gate.
# Never call this from run.zsh: regression tests must not select their threshold.
require 'json'
require 'digest'

scores_path, annotations_path, output_path = ARGV
abort 'Usage: calibrate-scorer.rb raw-scores.json annotations.json result.json' unless output_path
records = JSON.parse(File.read(scores_path))
annotations = JSON.parse(File.read(annotations_path))
abort 'Unsupported annotation schema' unless annotations.fetch('schemaVersion') == 1
abort 'No measured scores' if records.empty?
fixtures = records.group_by { |record| record.fetch('fixtureID') }
expected_ids = annotations.fetch('fixtures').map { |fixture| fixture.fetch('id') }.sort
abort 'Missing or unknown fixtures' unless fixtures.keys.sort == expected_ids
fixtures.each_value do |frames|
  slots = frames.map { |frame| frame.fetch('score').fetch('sampleIndex') }
  abort 'Incomplete or unordered sampling' unless slots == (0...slots.size).to_a
end

def distance(frame)
  [frame.fetch('wholeDistance'), frame.fetch('cropDistance')].min
end

def zone_at(fixture, time)
  fixture.fetch('zones').find do |zone|
    time >= zone.fetch('start') && (time < zone.fetch('end') ||
      (zone.fetch('endInclusive') && time == zone.fetch('end')))
  end&.fetch('kind') || 'unannotated'
end

def evaluate(fixtures, annotations, threshold)
  openings = []
  annotations.fetch('fixtures').each do |fixture|
    active = false
    last_support = nil
    last_slot = nil
    streak = 0
    fixtures.fetch(fixture.fetch('id')).each do |record|
      frame = record.fetch('score')
      time = frame.fetch('timestamp')
      slot = frame.fetch('sampleIndex')
      if active && time - last_support >= 1.5
        active = false
        streak = 0
      end
      streak = 0 if last_slot && slot != last_slot + 1
      if distance(frame) <= threshold
        streak += 1
        last_support = time
        if !active && streak >= 2
          active = true
          openings << { fixtureID: fixture.fetch('id'), timestamp: time,
                        frameID: frame.fetch('frameID'), zone: zone_at(fixture, time) }
        end
      else
        streak = 0
      end
      last_slot = slot
    end
  end
  expected = annotations.fetch('fixtures').select { |f| f.fetch('zones').any? { |z| z.fetch('kind') == 'expected' } }
  passed = openings.none? { |o| o[:zone] == 'falsePositive' } && expected.all? do |fixture|
    openings.any? { |o| o[:fixtureID] == fixture.fetch('id') && o[:zone] == 'expected' }
  end
  { passed: passed, openings: openings }
end

values = records.map { |record| distance(record.fetch('score')) }.uniq.sort
abort 'Nonfinite or negative distances' unless values.all? { |value| value.finite? && value >= 0 }
# Decisions are constant on each [distance, nextDistance) interval. This exhausts
# all possible supporting-frame assignments, including no-support and all-support.
candidates = ([0.0] + values).uniq.map do |lower|
  upper = values.find { |value| value > lower }
  threshold = upper ? (lower + upper) / 2 : lower
  outcome = evaluate(fixtures, annotations, threshold)
  { lowerInclusive: lower, upperExclusive: upper, threshold: threshold,
    decisionMargin: values.map { |value| (threshold - value).abs }.min,
    **outcome }
end
feasible = candidates.select { |candidate| candidate[:passed] }
chosen = feasible.max_by { |candidate| candidate[:decisionMargin] }
result = {
  schemaVersion: 1, result: chosen ? 'PASS' : 'STOP',
  method: 'exhaustive threshold intervals; two consecutive samples; 1.5-second gap',
  visionRevision: 2, cropAndScale: 'scaleFill', centralCropFraction: 0.6,
  sampleFPS: 2, supportingRule: 'distance <= threshold',
  similarity: '1/(1+distance)', computeDevice: 'Vision automatic',
  scoresSHA256: Digest::SHA256.file(scores_path).hexdigest,
  annotationsSHA256: Digest::SHA256.file(annotations_path).hexdigest,
  measuredFrames: fixtures.transform_values(&:length),
  testedThresholdIntervals: candidates.length, feasibleIntervals: feasible,
  selected: chosen, candidates: candidates
}
File.write(output_path, JSON.pretty_generate(result) + "\n")
puts JSON.pretty_generate(result.reject { |key, _| key == :candidates })
exit(chosen ? 0 : 2)
