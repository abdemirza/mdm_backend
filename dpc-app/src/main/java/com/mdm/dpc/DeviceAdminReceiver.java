package com.mdm.dpc;

import android.app.admin.DeviceAdminReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;
import android.widget.Toast;

/**
 * DeviceAdminReceiver class for handling device admin events
 * This class listens for events like device admin activation and can enforce policies
 */
public class DeviceAdminReceiver extends DeviceAdminReceiver {
    
    private static final String TAG = "MDMDeviceAdminReceiver";
    
    @Override
    public void onEnabled(Context context, Intent intent) {
        super.onEnabled(context, intent);
        Log.i(TAG, "Device admin enabled");
        Toast.makeText(context, "Device admin enabled", Toast.LENGTH_SHORT).show();
    }
    
    @Override
    public void onDisabled(Context context, Intent intent) {
        super.onDisabled(context, intent);
        Log.i(TAG, "Device admin disabled");
        Toast.makeText(context, "Device admin disabled", Toast.LENGTH_SHORT).show();
    }
    
    @Override
    public CharSequence onDisableRequested(Context context, Intent intent) {
        Log.i(TAG, "Device admin disable requested");
        return "Disabling device admin will remove MDM control from this device";
    }
    
    @Override
    public void onPasswordChanged(Context context, Intent intent) {
        super.onPasswordChanged(context, intent);
        Log.i(TAG, "Password changed");
    }
    
    @Override
    public void onPasswordFailed(Context context, Intent intent) {
        super.onPasswordFailed(context, intent);
        Log.i(TAG, "Password failed");
    }
    
    @Override
    public void onPasswordSucceeded(Context context, Intent intent) {
        super.onPasswordSucceeded(context, intent);
        Log.i(TAG, "Password succeeded");
    }
    
    @Override
    public void onLockTaskModeEntering(Context context, Intent intent, String pkg) {
        super.onLockTaskModeEntering(context, intent, pkg);
        Log.i(TAG, "Lock task mode entering: " + pkg);
    }
    
    @Override
    public void onLockTaskModeExiting(Context context, Intent intent) {
        super.onLockTaskModeExiting(context, intent);
        Log.i(TAG, "Lock task mode exiting");
    }
}

