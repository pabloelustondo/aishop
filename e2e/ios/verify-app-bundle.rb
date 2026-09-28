#!/usr/bin/env ruby
require 'digest'

configuration, app = ARGV
abort 'Usage: verify-app-bundle.rb Debug|Release /path/to/AIShop.app' unless %w[Debug Release].include?(configuration) && app
abort 'Missing app executable' unless File.file?(File.join(app, 'AIShop'))
fixtures = {
  'banana.JPG' => 'bfa0e47d6025a274bf34da372a8c6c0d7d39893838dd25fe42529fe1139ebb7a',
  'video_with_banana_trimmed.mov' => '1f4dfcf6f3e02cd370c8a71fdec0ca9bf5a171a7df18812b7b8d8aae26ab4648',
  'video_without_banana_trimmed.mov' => '93fda716a48cc5e09be36284da95973d5e6dbfcb49d6fbf748fb958a782c9c01'
}
if configuration == 'Debug'
  folder = File.join(app, 'VisionFixtures')
  abort 'Missing or extra Debug fixtures' unless Dir.children(folder).sort == fixtures.keys.sort
  fixtures.each do |name, hash|
    abort "Wrong Debug fixture identity: #{name}" unless Digest::SHA256.file(File.join(folder, name)).hexdigest == hash
  end
else
  banned = Dir.glob(File.join(app, '**', '*')).select { |path| File.basename(path) =~ /banana|VisionFixtures|annotations\.json/i }
  abort "Forbidden Release assets: #{banned}" unless banned.empty?
  strings = IO.popen(['strings', File.join(app, 'AIShop')], &:read)
  abort 'Diagnostic route or harness present in Release' if strings =~ /vision-diagnostics|AI_SHOP_VISION_HARNESS|VisionDiagnosticHarness|VisionHarnessModel/
end
puts "PASS: #{configuration} app bundle isolation and fixture checks"
