import Foundation

public enum LogValue: Codable, Equatable {
    case string(String), number(Double), bool(Bool), object([String: LogValue]), array([LogValue]), null

    public init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        if container.decodeNil() { self = .null }
        else if let value = try? container.decode(Bool.self) { self = .bool(value) }
        else if let value = try? container.decode(Double.self) { self = .number(value) }
        else if let value = try? container.decode(String.self) { self = .string(value) }
        else if let value = try? container.decode([String: LogValue].self) { self = .object(value) }
        else { self = .array(try container.decode([LogValue].self)) }
    }

    public func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        switch self {
        case .string(let value): try container.encode(value)
        case .number(let value): try container.encode(value)
        case .bool(let value): try container.encode(value)
        case .object(let value): try container.encode(value)
        case .array(let value): try container.encode(value)
        case .null: try container.encodeNil()
        }
    }

    public var number: Double? { if case .number(let value) = self { return value }; return nil }
    public var string: String? { if case .string(let value) = self { return value }; return nil }
    public var bool: Bool? { if case .bool(let value) = self { return value }; return nil }

    public static func fields<T: Encodable>(from value: T) throws -> [String: LogValue] {
        try JSONDecoder().decode([String: LogValue].self, from: JSONEncoder().encode(value))
    }
}

public enum SessionEventKind: String, Codable {
    case sessionStarted, frameReceived, frameSampled, frameSkipped, frameDropped, frameFailed
    case score, episodeOpened, bestFrameReplaced, episodeClosed
    case streamStopped, streamCancelled, streamExhausted, error, sessionSummary
}

public struct SessionEvent: Codable, Equatable {
    public let sequence: Int
    public let sessionID: String
    public let kind: SessionEventKind
    public let frameID: String?
    public let timestamp: Double?
    public let fields: [String: LogValue]

    public func payload<T: Decodable>(as type: T.Type) throws -> T {
        try JSONDecoder().decode(type, from: JSONEncoder().encode(fields))
    }
}

public enum SessionLogError: Error, Equatable {
    case closed, invalidSequence, invalidSession, incomplete, missingScores, failedSession
}
