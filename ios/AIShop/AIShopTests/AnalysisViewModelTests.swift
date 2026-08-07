import XCTest
@testable import AIShop

@MainActor
final class AnalysisViewModelTests: XCTestCase {
    func testAnalyzePublishesResultAndClearReturnsToIdle() async {
        let model = AnalysisViewModel(api: StubAPI(result: .success("Tomatoes detected.")))
        await model.analyze(Data([1, 2, 3]))
        XCTAssertEqual(model.phase, .result("Tomatoes detected."))

        model.clear()
        XCTAssertEqual(model.phase, .idle)
    }

    func testAnalyzePublishesUnderstandableFailure() async {
        let model = AnalysisViewModel(
            api: StubAPI(result: .failure(.server("Use a clearer picture.")))
        )
        await model.analyze(Data([1]))
        XCTAssertEqual(model.phase, .failure("Use a clearer picture."))
    }

    func testCaptureErrorRemovesImageAvailableForRetry() async {
        let model = AnalysisViewModel(api: StubAPI(result: .success("Old result")))
        await model.analyze(Data([1]))

        model.showCaptureError("Capture failed.")
        XCTAssertFalse(model.canRetry)
        await model.retry()

        XCTAssertEqual(model.phase, .failure("Capture failed."))
    }
}

private struct StubAPI: AnalyzeProductAPI {
    let result: Result<String, APIError>

    func analyze(jpegData: Data) async throws -> String {
        try result.get()
    }
}
