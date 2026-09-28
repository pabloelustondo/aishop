require 'json'
abort 'usage: verify-results.rb SWIFT-TEST.log REQUIRED.txt [SUMMARY.json]' unless (2..3).cover?(ARGV.length)
begin
  log = File.read(ARGV[0])
  # Swift 6.4's Xcode build engine accepts --xunit-output but does not emit XML
  # for these XCTest bundles. Validate the actual complete XCTest transcript.
  cases = log.scan(/Test Case '-\[([^\s]+) ([^\]]+)\]' (passed|failed|skipped)/)
  abort 'No tests executed' if cases.empty?
  abort 'Failed or skipped tests' unless cases.all? { |item| item[2] == 'passed' }
  abort 'Incomplete XCTest run' unless log.include?("Test Suite 'All tests' passed")
  totals = log.scan(/Executed (\d+) tests?, with (\d+) failures?/).last
  abort 'Inconsistent test totals' unless totals && totals[0].to_i == cases.length && totals[1].to_i.zero?
  executed = cases.map { |name, method, _| "#{name}.#{method}" }
  abort 'Duplicated test results' unless executed.uniq.length == executed.length
  required = File.readlines(ARGV[1], chomp: true).reject { |line| line.empty? || line.start_with?('#') }
  abort 'Empty required-test manifest' if required.empty?
  missing = required.reject { |name| executed.any? { |value| value.end_with?(name) } }
  abort "Missing required tests: #{missing.join(', ')}" unless missing.empty?
  File.write(ARGV[2], JSON.pretty_generate({result: 'PASS', count: cases.length, tests: executed})) if ARGV[2]
  puts "Verified #{cases.length} executed tests, no skips; #{required.length} required checks present"
rescue StandardError => error
  abort "Invalid test evidence: #{error.message}"
end
