import AIShopVisionEvaluation
import Foundation

do {
    let args = Array(CommandLine.arguments.dropFirst())
    guard args.count == 2 || args.count == 6 else {
        throw NSError(domain: "Usage: AIShopVisionEvaluate annotations.json session.jsonl OR annotations.json --compare mac-positive.jsonl mac-negative.jsonl phone-positive.jsonl phone-negative.jsonl", code: 1)
    }
    let evaluator = try FixtureEvaluator(annotationsURL: URL(fileURLWithPath: args[0]))
    let encoder = JSONEncoder()
    encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
    if args.count == 2 {
        let report = try evaluator.evaluate(logURL: URL(fileURLWithPath: args[1]))
        print(String(decoding: try encoder.encode(report), as: UTF8.self))
        exit(report.passed ? 0 : 1)
    }
    guard args[1] == "--compare" else { throw EvaluationError.incompatibleHeader }
    let comparison = try evaluator.compare(macLogURLs: args[2...3].map { URL(fileURLWithPath: $0) },
                                           phoneLogURLs: args[4...5].map { URL(fileURLWithPath: $0) })
    print(String(decoding: try encoder.encode(comparison), as: UTF8.self))
    // 2 means a Major threshold-disagreement finding, not a passing calibration.
    exit(!comparison.phoneOutcomePassed ? 1 : (comparison.thresholdAgreement ? 0 : 2))
} catch {
    FileHandle.standardError.write(Data("FAIL: \(error)\n".utf8))
    exit(1)
}
