if(NOT TARGET react-native-reanimated::reanimated)
add_library(react-native-reanimated::reanimated SHARED IMPORTED)
set_target_properties(react-native-reanimated::reanimated PROPERTIES
    IMPORTED_LOCATION "/Users/mac/Developer/stockbook/stockbook-mobile/node_modules/react-native-reanimated/android/build/intermediates/cxx/Debug/191d5t5j/obj/x86/libreanimated.so"
    INTERFACE_INCLUDE_DIRECTORIES "/Users/mac/Developer/stockbook/stockbook-mobile/node_modules/react-native-reanimated/android/build/prefab-headers/reanimated"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

