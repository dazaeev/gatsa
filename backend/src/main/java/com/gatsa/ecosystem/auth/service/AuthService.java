package com.gatsa.ecosystem.auth.service;

import com.gatsa.ecosystem.auth.dto.JwtAuthenticationResponse;
import com.gatsa.ecosystem.auth.dto.LoginRequest;
import com.gatsa.ecosystem.auth.dto.RegisterRequest;

public interface AuthService {
    JwtAuthenticationResponse login(LoginRequest loginRequest);
    JwtAuthenticationResponse register(RegisterRequest registerRequest);
}
