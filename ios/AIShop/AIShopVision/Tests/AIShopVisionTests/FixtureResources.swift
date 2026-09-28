import Foundation

enum FixtureResources {
    static func url(_ name: String, extension suffix: String) throws -> URL {
        guard let url = Bundle.module.url(forResource: name, withExtension: suffix,
                                          subdirectory: "Resources") else {
            throw CocoaError(.fileNoSuchFile)
        }
        return url
    }
}
