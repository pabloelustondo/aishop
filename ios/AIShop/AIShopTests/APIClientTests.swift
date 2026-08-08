import XCTest
@testable import AIShop

final class APIClientTests: XCTestCase {
    override func tearDown() {
        StubURLProtocol.handler = nil
        super.tearDown()
    }

    func testAnalyzeSendsTargetModeAndReturnsStructuredReport() async throws {
        let jpeg = Data([0xFF, 0xD8, 0xFF])
        StubURLProtocol.handler = { request in
            XCTAssertEqual(request.url?.absoluteString, "https://shop.test/analyze-product")
            XCTAssertEqual(request.httpMethod, "POST")
            XCTAssertEqual(request.value(forHTTPHeaderField: "Content-Type"), "application/json")
            XCTAssertEqual(request.value(forHTTPHeaderField: "Authorization"), "Bearer test-token")
            let json = try XCTUnwrap(JSONSerialization.jsonObject(
                with: try XCTUnwrap(request.bodyData)
            ) as? [String: String])
            XCTAssertEqual(json["imageBase64"], jpeg.base64EncodedString())
            XCTAssertEqual(json["mediaType"], "image/jpeg")
            XCTAssertEqual(json["mode"], "targetProduct")
            return self.response(status: 200, body: self.targetResponse)
        }

        let response = try await makeClient().analyze(jpegData: jpeg, mode: .targetProduct)
        guard case .targetProduct(let report) = response else {
            return XCTFail("Expected target report")
        }
        XCTAssertEqual(report.productName, "Tomatoes")
    }

    func testAnalyzeSendsAreaModeAndReturnsProductCollection() async throws {
        StubURLProtocol.handler = { request in
            let json = try XCTUnwrap(JSONSerialization.jsonObject(
                with: try XCTUnwrap(request.bodyData)
            ) as? [String: String])
            XCTAssertEqual(json["mode"], "areaScan")
            return self.response(status: 200, body: self.areaResponse)
        }

        let response = try await makeClient().analyze(jpegData: Data([1]), mode: .areaScan)
        guard case .areaScan(let report) = response else {
            return XCTFail("Expected area report")
        }
        XCTAssertEqual(report.identifiedProducts.count, 1)
    }

    func testAnalyzeSurfacesServerError() async {
        StubURLProtocol.handler = { _ in
            self.response(status: 422, body: #"{"error":"Use a clearer picture."}"#)
        }
        do {
            _ = try await makeClient().analyze(jpegData: Data([1]), mode: .targetProduct)
            XCTFail("Expected an error")
        } catch {
            XCTAssertEqual(error as? APIError, .server("Use a clearer picture."))
        }
    }

    func testAnalyzeRejectsReportForWrongMode() async {
        StubURLProtocol.handler = { _ in
            self.response(status: 200, body: self.targetResponse)
        }
        do {
            _ = try await makeClient().analyze(jpegData: Data([1]), mode: .areaScan)
            XCTFail("Expected an error")
        } catch {
            XCTAssertEqual(error as? APIError, .invalidResponse)
        }
    }

    private func makeClient() -> APIClient {
        let configuration = URLSessionConfiguration.ephemeral
        configuration.protocolClasses = [StubURLProtocol.self]
        return APIClient(
            baseURL: URL(string: "https://shop.test")!,
            clientToken: "test-token",
            session: URLSession(configuration: configuration)
        )
    }

    private func response(status: Int, body: String) -> (HTTPURLResponse, Data) {
        let url = URL(string: "https://shop.test/analyze-product")!
        return (HTTPURLResponse(url: url, statusCode: status, httpVersion: nil, headerFields: nil)!, Data(body.utf8))
    }

    private var targetResponse: String {
        #"{"mode":"targetProduct","report":{"productName":"Tomatoes","summary":"Fresh tomatoes","visibleEvidence":["Red color"],"missingInformation":["Price"],"conclusion":"insufficient_evidence","conclusionReason":"Price is missing","confidence":"medium"}}"#
    }

    private var areaResponse: String {
        #"{"mode":"areaScan","report":{"summary":"One product","identifiedProducts":[{"name":"Tomatoes","visibleEvidence":["Red produce"],"confidence":"high"}],"uncertainItems":[]}}"#
    }
}
