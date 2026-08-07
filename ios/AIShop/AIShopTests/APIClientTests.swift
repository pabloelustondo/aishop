import XCTest
@testable import AIShop

final class APIClientTests: XCTestCase {
    override func tearDown() {
        StubURLProtocol.handler = nil
        super.tearDown()
    }

    func testAnalyzeSendsExactContractAndReturnsMessage() async throws {
        let jpeg = Data([0xFF, 0xD8, 0xFF])
        StubURLProtocol.handler = { request in
            XCTAssertEqual(request.url?.absoluteString, "https://shop.test/analyze-product")
            XCTAssertEqual(request.httpMethod, "POST")
            XCTAssertEqual(request.value(forHTTPHeaderField: "Content-Type"), "application/json")
            XCTAssertEqual(request.value(forHTTPHeaderField: "Authorization"), "Bearer test-token")
            let json = try XCTUnwrap(
                JSONSerialization.jsonObject(with: try XCTUnwrap(request.bodyData)) as? [String: String]
            )
            XCTAssertEqual(json["imageBase64"], jpeg.base64EncodedString())
            XCTAssertEqual(json["mediaType"], "image/jpeg")
            return self.response(status: 200, body: #"{"message":"Fresh tomatoes detected."}"#)
        }

        let message = try await makeClient().analyze(jpegData: jpeg)
        XCTAssertEqual(message, "Fresh tomatoes detected.")
    }

    func testAnalyzeSurfacesServerError() async {
        StubURLProtocol.handler = { _ in
            self.response(status: 422, body: #"{"error":"Use a clearer picture."}"#)
        }
        do {
            _ = try await makeClient().analyze(jpegData: Data([1]))
            XCTFail("Expected an error")
        } catch {
            XCTAssertEqual(error as? APIError, .server("Use a clearer picture."))
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
}
