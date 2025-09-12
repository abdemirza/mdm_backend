package com.mdm.dpc;

import android.app.Activity;
import android.app.admin.DevicePolicyManager;
import android.content.ComponentName;
import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;

/**
 * Main Activity for the MDM DPC App
 */
public class MainActivity extends Activity {
    
    private static final String TAG = "MDMMainActivity";
    private DevicePolicyManager mDPM;
    private ComponentName mAdminComponent;
    private TextView mStatusText;
    private Button mLockButton;
    private Button mEnableAdminButton;
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        
        mDPM = (DevicePolicyManager) getSystemService(DEVICE_POLICY_SERVICE);
        mAdminComponent = new ComponentName(this, DeviceAdminReceiver.class);
        
        mStatusText = findViewById(R.id.status_text);
        mLockButton = findViewById(R.id.lock_button);
        mEnableAdminButton = findViewById(R.id.enable_admin_button);
        
        updateStatus();
        
        mLockButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                lockDevice();
            }
        });
        
        mEnableAdminButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                enableDeviceAdmin();
            }
        });
    }
    
    private void updateStatus() {
        boolean isDeviceOwner = mDPM.isDeviceOwnerApp(getPackageName());
        boolean isProfileOwner = mDPM.isProfileOwnerApp(getPackageName());
        boolean isAdminActive = mDPM.isAdminActive(mAdminComponent);
        
        String status = "Device Owner: " + (isDeviceOwner ? "Yes" : "No") + "\n" +
                       "Profile Owner: " + (isProfileOwner ? "Yes" : "No") + "\n" +
                       "Admin Active: " + (isAdminActive ? "Yes" : "No");
        
        mStatusText.setText(status);
        
        mLockButton.setEnabled(isDeviceOwner || isProfileOwner);
        mEnableAdminButton.setEnabled(!isAdminActive);
    }
    
    private void lockDevice() {
        try {
            mDPM.lockNow();
            Toast.makeText(this, "Device locked", Toast.LENGTH_SHORT).show();
            Log.i(TAG, "Device locked successfully");
        } catch (Exception e) {
            Toast.makeText(this, "Failed to lock device", Toast.LENGTH_SHORT).show();
            Log.e(TAG, "Failed to lock device", e);
        }
    }
    
    private void enableDeviceAdmin() {
        Intent intent = new Intent(DevicePolicyManager.ACTION_ADD_DEVICE_ADMIN);
        intent.putExtra(DevicePolicyManager.EXTRA_DEVICE_ADMIN, mAdminComponent);
        intent.putExtra(DevicePolicyManager.EXTRA_ADD_EXPLANATION,
                "This app needs device admin permissions to manage the device.");
        startActivity(intent);
    }
    
    @Override
    protected void onResume() {
        super.onResume();
        updateStatus();
    }
}
