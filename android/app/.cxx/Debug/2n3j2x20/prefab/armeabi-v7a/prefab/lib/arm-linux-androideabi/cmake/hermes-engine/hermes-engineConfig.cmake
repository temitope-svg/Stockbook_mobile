if(NOT TARGET hermes-engine::hermesvm)
add_library(hermes-engine::hermesvm SHARED IMPORTED)
set_target_properties(hermes-engine::hermesvm PROPERTIES
    IMPORTED_LOCATION "/private/var/folders/1d/kdxws4v92cn9ty2r_dmvldsw0000gn/T/cursor-sandbox-cache/ea2149e58550b6652cd0a9e362011d83/gradle/caches/9.4.1/transforms/cb74f671c90fd9062c26e633f1d2a6cd/transformed/hermes-android-250829098.0.17-debug/prefab/modules/hermesvm/libs/android.armeabi-v7a/libhermesvm.so"
    INTERFACE_INCLUDE_DIRECTORIES "/private/var/folders/1d/kdxws4v92cn9ty2r_dmvldsw0000gn/T/cursor-sandbox-cache/ea2149e58550b6652cd0a9e362011d83/gradle/caches/9.4.1/transforms/cb74f671c90fd9062c26e633f1d2a6cd/transformed/hermes-android-250829098.0.17-debug/prefab/modules/hermesvm/include"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

