package com.mdm.dpc;

import android.app.admin.DevicePolicyManager;
import android.content.ComponentName;
import android.content.Context;
import android.util.Log;

/**
 * DevicePolicyManager wrapper for MDM operations
 * This class handles device policy management and lock operations
 */
public class DevicePolicyManager {
    
    private static final String TAG = "MDMDevicePolicyManager";
    private DevicePolicyManager mDPM;
    private ComponentName mAdminComponent;
    private Context mContext;
    
    public DevicePolicyManager(Context context) {
        mContext = context;
        mDPM = (DevicePolicyManager) context.getSystemService(Context.DEVICE_POLICY_SERVICE);
        mAdminComponent = new ComponentName(context, DeviceAdminReceiver.class);
    }
    
    /**
     * Check if the app is a device owner
     */
    public boolean isDeviceOwner() {
        return mDPM.isDeviceOwnerApp(mContext.getPackageName());
    }
    
    /**
     * Check if the app is a profile owner
     */
    public boolean isProfileOwner() {
        return mDPM.isProfileOwnerApp(mContext.getPackageName());
    }
    
    /**
     * Lock the device immediately
     */
    public void lockNow() {
        if (isDeviceOwner() || isProfileOwner()) {
            try {
                mDPM.lockNow();
                Log.i(TAG, "Device locked successfully");
            } catch (Exception e) {
                Log.e(TAG, "Failed to lock device", e);
            }
        } else {
            Log.w(TAG, "App is not device owner or profile owner");
        }
    }
    
    /**
     * Lock the device with a timeout
     */
    public void lockNow(int timeout) {
        if (isDeviceOwner() || isProfileOwner()) {
            try {
                mDPM.lockNow();
                Log.i(TAG, "Device locked successfully with timeout: " + timeout);
            } catch (Exception e) {
                Log.e(TAG, "Failed to lock device with timeout", e);
            }
        } else {
            Log.w(TAG, "App is not device owner or profile owner");
        }
    }
    
    /**
     * Set password quality requirements
     */
    public void setPasswordQuality(int quality) {
        if (isDeviceOwner() || isProfileOwner()) {
            try {
                mDPM.setPasswordQuality(mAdminComponent, quality);
                Log.i(TAG, "Password quality set to: " + quality);
            } catch (Exception e) {
                Log.e(TAG, "Failed to set password quality", e);
            }
        }
    }
    
    /**
     * Set minimum password length
     */
    public void setPasswordMinimumLength(int length) {
        if (isDeviceOwner() || isProfileOwner()) {
            try {
                mDPM.setPasswordMinimumLength(mAdminComponent, length);
                Log.i(TAG, "Minimum password length set to: " + length);
            } catch (Exception e) {
                Log.e(TAG, "Failed to set minimum password length", e);
            }
        }
    }
    
    /**
     * Get device admin component name
     */
    public ComponentName getAdminComponent() {
        return mAdminComponent;
    }
    
    /**
     * Check if device admin is enabled
     */
    public boolean isAdminActive() {
        return mDPM.isAdminActive(mAdminComponent);
    }
}
