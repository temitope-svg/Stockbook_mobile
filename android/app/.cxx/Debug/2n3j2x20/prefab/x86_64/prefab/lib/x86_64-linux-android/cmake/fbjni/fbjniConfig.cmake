if(NOT TARGET fbjni::fbjni)
add_library(fbjni::fbjni SHARED IMPORTED)
set_target_properties(fbjni::fbjni PROPERTIES
    IMPORTED_LOCATION "/private/var/folders/1d/kdxws4v92cn9ty2r_dmvldsw0000gn/T/cursor-sandbox-cache/ea2149e58550b6652cd0a9e362011d83/gradle/caches/9.4.1/transforms/3cb1792e16d0777e9535521c99f0b7b5/transformed/fbjni-0.7.0/prefab/modules/fbjni/libs/android.x86_64/libfbjni.so"
    INTERFACE_INCLUDE_DIRECTORIES "/private/var/folders/1d/kdxws4v92cn9ty2r_dmvldsw0000gn/T/cursor-sandbox-cache/ea2149e58550b6652cd0a9e362011d83/gradle/caches/9.4.1/transforms/3cb1792e16d0777e9535521c99f0b7b5/transformed/fbjni-0.7.0/prefab/modules/fbjni/include"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

