#!/bin/zsh
# Offline macOS pipeline integration gate. This does not certify the iPhone UI.
set -u
set -o pipefail
repo_root="${0:A:h:h:h}"
package_path="$repo_root/ios/AIShop/AIShopVision"
run_dir="$(mktemp -d "${TMPDIR:-/tmp}/aishop-vision-gate.XXXXXX")" || exit 1
export AI_SHOP_VISION_ARTIFACTS="$run_dir"
print -r -- "AIShopVision macOS gate; evidence: $run_dir"
swift test --package-path "$package_path" --disable-automatic-resolution \
  --skip-update --scratch-path "$run_dir/build" \
  > "$run_dir/swift-test.log" 2>&1
test_status=$?
cat "$run_dir/swift-test.log"
if (( test_status != 0 )); then
  print -r -- "FAIL: Swift tests exited $test_status; evidence: $run_dir"
  exit "$test_status"
fi
if ! /usr/bin/ruby "$repo_root/e2e/ios/verify-results.rb" "$run_dir/swift-test.log" \
  "$repo_root/e2e/ios/required-tests.txt" "$run_dir/test-summary.json"; then
  print -r -- "FAIL: incomplete test evidence; evidence: $run_dir"
  exit 1
fi
print -r -- "PASS: macOS pipeline tests; evidence: $run_dir"
