#!/bin/sh
set -eu
destination="${TARGET_BUILD_DIR:?}/${UNLOCALIZED_RESOURCES_FOLDER_PATH:?}/VisionFixtures"
if [ "${CONFIGURATION:?}" != "Debug" ]; then
    if [ -e "$destination" ]; then
        echo "error: Release must not contain VisionFixtures; use a clean build output." >&2
        exit 1
    fi
    exit 0
fi
source_directory="${SRCROOT:?}/AIShopVision/Tests/AIShopVisionTests/Resources"
mkdir -p "$destination"
for filename in banana.JPG video_with_banana_trimmed.mov video_without_banana_trimmed.mov; do
    # Strip metadata only in generated copies, never in the source fixture files.
    /usr/bin/ditto --norsrc --noextattr "$source_directory/$filename" "$destination/$filename"
done
