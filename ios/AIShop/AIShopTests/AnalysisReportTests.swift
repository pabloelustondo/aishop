import XCTest
@testable import AIShop

final class AnalysisReportTests: XCTestCase {
    func testDecodesTargetProductResponse() throws {
        let data = Data(#"{"mode":"targetProduct","report":{"productName":"Tomatoes","summary":"Fresh tomatoes","visibleEvidence":["Red color"],"missingInformation":["Price"],"conclusion":"insufficient_evidence","conclusionReason":"Price is missing","confidence":"medium"}}"#.utf8)

        let response = try JSONDecoder().decode(AnalysisReportResponse.self, from: data)

        guard case let .targetProduct(report) = response else {
            return XCTFail("Expected a target product report")
        }
        XCTAssertEqual(report.productName, "Tomatoes")
        XCTAssertEqual(report.conclusion, .insufficientEvidence)
        XCTAssertEqual(report.confidence, .medium)
    }

    func testDecodesAreaScanResponse() throws {
        let data = Data(#"{"mode":"areaScan","report":{"summary":"One product","identifiedProducts":[{"name":"Tomatoes","visibleEvidence":["Red produce"],"confidence":"high"}],"uncertainItems":[{"description":"Green package","reason":"Label hidden"}]}}"#.utf8)

        let response = try JSONDecoder().decode(AnalysisReportResponse.self, from: data)

        guard case let .areaScan(report) = response else {
            return XCTFail("Expected an area scan report")
        }
        XCTAssertEqual(report.identifiedProducts.first?.name, "Tomatoes")
        XCTAssertEqual(report.uncertainItems.first?.reason, "Label hidden")
    }

    func testRejectsUnknownMode() {
        let data = Data(#"{"mode":"unknown","report":{}}"#.utf8)

        XCTAssertThrowsError(
            try JSONDecoder().decode(AnalysisReportResponse.self, from: data)
        )
    }
}
