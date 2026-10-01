package com.gatsa.ecosystem.constant;

public final class SecurityConstants {
    private SecurityConstants() {
        // Prevent instantiation
    }

    public static final String TOKEN_PREFIX = "Bearer ";
    public static final String HEADER_STRING = "Authorization";
    
    // Roles
    public static final String ROLE_LEAD = "ROLE_LEAD";
    public static final String ROLE_CLIENT = "ROLE_CLIENT";
    public static final String ROLE_PARTNER = "ROLE_PARTNER";
    public static final String ROLE_AGENT = "ROLE_AGENT";
    public static final String ROLE_ADMIN = "ROLE_ADMIN";
}
