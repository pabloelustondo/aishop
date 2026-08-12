import XCTest
@testable import AIShop

final class InspectionAPIClientTests: XCTestCase {
    override func tearDown() {
        StubURLProtocol.handler = nil
        super.tearDown()
    }

    func testSubmitsExactBytesAndAuditMetadata() async throws {
        let jpeg = Data([0xFF, 0xD8, 1, 2, 0xFF, 0xD9])
        StubURLProtocol.handler = { request in
            XCTAssertEqual(request.url?.path, "/inspections")
            let body = try XCTUnwrap(request.bodyData)
            let json = try XCTUnwrap(JSONSerialization.jsonObject(with: body) as? [String: Any])
            XCTAssertEqual(json["imageBase64"] as? String, jpeg.base64EncodedString())
            XCTAssertEqual(json["mediaType"] as? String, "image/jpeg")
            XCTAssertEqual(json["mode"] as? String, "targetProduct")
            XCTAssertEqual(json["appVersion"] as? String, "1.2 (3)")
            XCTAssertEqual((json["targetPosition"] as? [String: Double])?["x"], 0.5)
            return self.response
        }
        let configuration = URLSessionConfiguration.ephemeral
        configuration.protocolClasses = [StubURLProtocol.self]
        let client = InspectionAPIClient(
            baseURL: URL(string: "https://shop.test")!,
            appVersion: "1.2 (3)",
            session: URLSession(configuration: configuration),
            idToken: { "test-id-token" }
        )

        _ = try await client.analyze(jpegData: jpeg, mode: .targetProduct)
    }

    private var response: (HTTPURLResponse, Data) {
        let url = URL(string: "https://shop.test/inspections")!
        let body = #"{"mode":"targetProduct","report":{"productName":"Salt","summary":"Salt","visibleEvidence":["Center"],"missingInformation":[],"conclusion":"insufficient_evidence","conclusionReason":"Price missing","confidence":"high"}}"#
        return (
            HTTPURLResponse(url: url, statusCode: 200, httpVersion: nil, headerFields: nil)!,
            Data(body.utf8)
        )
    }
}
