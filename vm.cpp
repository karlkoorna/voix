#include <node_api.h>
#include <windows.h>
#include <math.h>

typedef long (*VbLogin)();
typedef long (*VbLogout)();
typedef long (*VbGetType)(long* value);
typedef long (*VbGetLevel)(long type, long channel, float* value);
typedef long (*VbIsDirty)();
typedef long (*VbSetFloat)(char* name, float value);
typedef long (*VbGetFloat)(char* name, float* value);

VbLogin vbLogin;
VbLogout vbLogout;
VbGetType vbGetType;
VbGetLevel vbGetLevel;
VbIsDirty vbIsDirty;
VbSetFloat vbSetFloat;
VbGetFloat vbGetFloat;

// Load Voicemeeter DLL.
napi_value load(napi_env env, napi_callback_info info) {
	napi_value args[1];
	size_t argsLength = 1;
	napi_get_cb_info(env, info, &argsLength, args, NULL, NULL);
	
	char str[1024];
	size_t strLen;
	napi_get_value_string_utf8(env, args[0], (char*) &str, 1024, &strLen);
	
	HMODULE dll = LoadLibrary(str);
	
	vbLogin = (VbLogin) GetProcAddress(dll, "VBVMR_Login");
	vbLogout = (VbLogout) GetProcAddress(dll, "VBVMR_Logout");
	vbGetType = (VbGetType) GetProcAddress(dll, "VBVMR_GetVoicemeeterType");
	vbGetLevel = (VbGetLevel) GetProcAddress(dll, "VBVMR_GetLevel");
	vbIsDirty = (VbIsDirty) GetProcAddress(dll, "VBVMR_IsParametersDirty");
	vbSetFloat = (VbSetFloat) GetProcAddress(dll, "VBVMR_SetParameterFloat");
	vbGetFloat = (VbGetFloat) GetProcAddress(dll, "VBVMR_GetParameterFloat");
	
	napi_value out;
	napi_get_boolean(env, dll, &out);
	return out;
}

// Start communication with Voicemeeter.
napi_value login(napi_env env, napi_callback_info info) {
	napi_value out;
	napi_create_int32(env, vbLogin(), &out);
	return out;
}

// Stop communication with Voicemeeter.
napi_value logout(napi_env env, napi_callback_info info) {
	napi_value out;
	napi_create_int32(env, vbLogout(), &out);
	return out;
}

// Get Voicemeeter type.
napi_value getType(napi_env env, napi_callback_info info) {
	long value;
	vbGetType(&value);
	
	napi_value out;
	napi_create_int32(env, value, &out);
	return out;
}

// Get audio channel level.
napi_value getLevel(napi_env env, napi_callback_info info) {
	napi_value args[2];
	size_t argsLength =2;
	napi_get_cb_info(env, info, &argsLength, args, NULL, NULL);
	
	long type;
	long channel;
	napi_get_value_int32(env, args[0], (int32_t*) &type);
	napi_get_value_int32(env, args[1], (int32_t*) &channel);
	
	float value;
	vbGetLevel(type, channel, &value);
	
	napi_value out;
	napi_create_int32(env, 20 * log10(value) + 60, &out);
	return out;
}

// Check if parameters have changed.
napi_value isDirty(napi_env env, napi_callback_info info) {
	napi_value out;
	napi_get_boolean(env, vbIsDirty() == 1, &out);
	return out;
}

// Set float value.
napi_value setFloat(napi_env env, napi_callback_info info) {
	napi_value args[2];
	size_t argsLength = 2;
	napi_get_cb_info(env, info, &argsLength, args, NULL, NULL);
	
	char name[16384];
	size_t nameLength;
	double value;
	napi_get_value_string_utf8(env, args[0], (char*) &name, 16384, &nameLength);
	napi_get_value_double(env, args[1], &value);
	
	napi_value out;
	napi_create_int32(env, vbSetFloat(name, value), &out);
	return out;
}

// Get float value.
napi_value getFloat(napi_env env, napi_callback_info info) {
	napi_value args[1];
	size_t argsLength = 1;
	napi_get_cb_info(env, info, &argsLength, args, NULL, NULL);
	
	char name[16384];
	size_t nameLength;
	napi_get_value_string_utf8(env, args[0], (char*) &name, 16384, &nameLength);
	
	float value;
	vbGetFloat(name, &value);
	
	napi_value out;
	napi_create_double(env, value, &out);
	return out;
}

napi_value init(napi_env env, napi_value exports) {
	napi_value fnLoad;
	napi_create_function(env, NULL, 0, load, NULL, &fnLoad);
	napi_set_named_property(env, exports, "load", fnLoad);
	
	napi_value fnLogin;
	napi_create_function(env, NULL, 0, login, NULL, &fnLogin);
	napi_set_named_property(env, exports, "login", fnLogin);
	
	napi_value fnLogout;
	napi_create_function(env, NULL, 0, logout, NULL, &fnLogout);
	napi_set_named_property(env, exports, "logout", fnLogout);
	
	napi_value fnGetType;
	napi_create_function(env, NULL, 0, getType, NULL, &fnGetType);
	napi_set_named_property(env, exports, "getType", fnGetType);
	
	napi_value fnGetLevel;
	napi_create_function(env, NULL, 0, getLevel, NULL, &fnGetLevel);
	napi_set_named_property(env, exports, "getLevel", fnGetLevel);
	
	napi_value fnIsDirty;
	napi_create_function(env, NULL, 0, isDirty, NULL, &fnIsDirty);
	napi_set_named_property(env, exports, "isDirty", fnIsDirty);
	
	napi_value fnSetFloat;
	napi_create_function(env, NULL, 0, setFloat, NULL, &fnSetFloat);
	napi_set_named_property(env, exports, "setFloat", fnSetFloat);
	
	napi_value fnGetFloat;
	napi_create_function(env, NULL, 0, getFloat, NULL, &fnGetFloat);
	napi_set_named_property(env, exports, "getFloat", fnGetFloat);
	
	return exports;
}

NAPI_MODULE(NODE_GYP_MODULE_NAME, init);
