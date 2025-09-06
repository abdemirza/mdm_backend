export interface Device {
  name: string;
  policyName: string;
  hardwareInfo?: {
    model?: string;
    manufacturer?: string;
    serialNumber?: string;
  };
  osVersion?: string;
  state?: 'ACTIVE' | 'DISABLED' | 'PROVISIONING' | 'LOST_MODE';
  appliedState?: 'ACTIVE' | 'DISABLED' | 'PROVISIONING' | 'LOST_MODE';
  lastStatusReportTime?: string;
  lastPolicySyncTime?: string;
  enrollmentTime?: string;
  user?: {
    accountIdentifier?: string;
    ownerType?: 'DEVICE_OWNER' | 'PROFILE_OWNER';
  };
}

export interface Command {
  type: 'LOCK' | 'REBOOT' | 'WIPE_DATA' | 'CLEAR_APP_DATA' | 'INSTALL_APP' | 'UNINSTALL_APP' | 'START_LOST_MODE' | 'STOP_LOST_MODE' | 'RESET_PASSWORD';
  duration?: string; // For LOCK command
  packageName?: string; // For app-related commands
  reason?: string;
  startLostModeParams?: {
    lostMessage?: {
      defaultMessage: string;
    };
    lostPhoneNumber?: {
      defaultMessage: string;
    };
    lostEmailAddress?: string;
    lostStreetAddress?: {
      defaultMessage: string;
    };
    lostOrganization?: {
      defaultMessage: string;
    };
  };
}

export interface CommandOperation {
  name: string;
  done: boolean;
  error?: {
    code: number;
    message: string;
  };
  response?: any;
}

export interface Enterprise {
  name: string;
  displayName?: string;
  enabledNotificationTypes?: string[];
  termsAndConditions?: string;
  contactInfo?: {
    contactEmail?: string;
    dataProtectionOfficerName?: string;
    dataProtectionOfficerEmail?: string;
    dataProtectionOfficerPhone?: string;
  };
}

export interface Policy {
  name: string;
  displayName?: string;
  version?: string;
  applications?: Array<{
    packageName: string;
    installType: 'FORCE_INSTALLED' | 'BLOCKED' | 'AVAILABLE';
  }>;
  passwordRequirements?: {
    passwordMinimumLength?: number;
    passwordMinimumLetters?: number;
    passwordMinimumNumeric?: number;
    passwordMinimumSymbols?: number;
    passwordMinimumNonLetter?: number;
    passwordMinimumLowercase?: number;
    passwordMinimumUppercase?: number;
  };
  locationMode?: 'LOCATION_DISABLED' | 'LOCATION_ENFORCED' | 'LOCATION_USER_CHOICE';
  wifiConfigs?: Array<{
    ssid: string;
    password?: string;
  }>;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}


