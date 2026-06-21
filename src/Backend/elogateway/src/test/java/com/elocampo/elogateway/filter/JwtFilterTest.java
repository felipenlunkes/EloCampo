package com.elocampo.elogateway.filter;

import com.elocampo.elogateway.config.JwtProperties;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpHeaders;
import org.springframework.security.core.context.SecurityContextHolder;

import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.Date;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class JwtFilterTest {

    private static final String SECRET = "QNyrmdUkpqi+Z7rPCrigN3dvLwbwxNz33d5r2STdr2M=";
    private static final String USER_ID = "user-123";
    private static final String USER_EMAIL = "user@example.com";

    @Mock
    private JwtProperties jwtProperties;

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    @Mock
    private FilterChain filterChain;

    @Captor
    private ArgumentCaptor<HttpServletRequest> requestCaptor;

    @InjectMocks
    private JwtFilter jwtFilter;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private String generateValidToken() {
        return generateValidToken(false);
    }

    private String generateValidToken(boolean isAdmin) {

        var key = Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8));

        return Jwts.builder()
                .subject(USER_ID)
                .claim("email", USER_EMAIL)
                .claim("isAdmin", isAdmin)
                .expiration(new Date(System.currentTimeMillis() + 3_600_000))
                .signWith(key)
                .compact();
    }

    @Test
    void doFilterInternalShouldPassRequestThroughWithoutAuthenticationWhenNoAuthorizationHeader() throws Exception {

        when(request.getHeader(HttpHeaders.AUTHORIZATION)).thenReturn(null);

        jwtFilter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    @Test
    void doFilterInternalShouldPassRequestThroughWithoutAuthenticationWhenAuthorizationHeaderIsNotBearer() throws Exception {

        when(request.getHeader(HttpHeaders.AUTHORIZATION)).thenReturn("Basic dXNlcjpwYXNz");

        jwtFilter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    @Test
    void doFilterInternalShouldSetAuthenticationInSecurityContextWhenTokenIsValid() throws Exception {

        when(jwtProperties.getSecret()).thenReturn(SECRET);
        when(request.getHeader(HttpHeaders.AUTHORIZATION)).thenReturn("Bearer " + generateValidToken());

        jwtFilter.doFilterInternal(request, response, filterChain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNotNull();
        assertThat(SecurityContextHolder.getContext().getAuthentication().getPrincipal()).isEqualTo(USER_ID);
    }

    @Test
    void doFilterInternalShouldInjectXUserIdHeaderFromTokenSubjectWhenTokenIsValid() throws Exception {

        when(jwtProperties.getSecret()).thenReturn(SECRET);
        when(request.getHeader(HttpHeaders.AUTHORIZATION)).thenReturn("Bearer " + generateValidToken());

        jwtFilter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(requestCaptor.capture(), any());
        assertThat(requestCaptor.getValue().getHeader("X-User-Id")).isEqualTo(USER_ID);
    }

    @Test
    void doFilterInternalShouldInjectXUserEmailHeaderFromTokenClaimWhenValidBearerToken() throws Exception {

        when(jwtProperties.getSecret()).thenReturn(SECRET);
        when(request.getHeader(HttpHeaders.AUTHORIZATION)).thenReturn("Bearer " + generateValidToken());

        jwtFilter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(requestCaptor.capture(), any());
        assertThat(requestCaptor.getValue().getHeader("X-User-Email")).isEqualTo(USER_EMAIL);
    }

    @Test
    void doFilterInternalShouldInjectXUserAdminHeaderFromTokenClaimWhenValidBearerToken() throws Exception {

        when(jwtProperties.getSecret()).thenReturn(SECRET);
        when(request.getHeader(HttpHeaders.AUTHORIZATION)).thenReturn("Bearer " + generateValidToken(true));

        jwtFilter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(requestCaptor.capture(), any());
        assertThat(requestCaptor.getValue().getHeader("X-User-Admin")).isEqualTo("true");
    }

    @Test
    void doFilterInternalShouldIncludeXUserHeaderNamesInEnumerationWhenValidBearerToken() throws Exception {

        when(jwtProperties.getSecret()).thenReturn(SECRET);
        when(request.getHeader(HttpHeaders.AUTHORIZATION)).thenReturn("Bearer " + generateValidToken());
        when(request.getHeaderNames()).thenReturn(Collections.emptyEnumeration());

        jwtFilter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(requestCaptor.capture(), any());
        var headerNames = Collections.list(requestCaptor.getValue().getHeaderNames());
        assertThat(headerNames).contains("X-User-Id", "X-User-Email", "X-User-Admin");
    }

    @Test
    void doFilterInternalShouldReturnEnumerationWithValueForXUserIdHeaderWhenValidBearerToken() throws Exception {

        when(jwtProperties.getSecret()).thenReturn(SECRET);
        when(request.getHeader(HttpHeaders.AUTHORIZATION)).thenReturn("Bearer " + generateValidToken());

        jwtFilter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(requestCaptor.capture(), any());
        var values = Collections.list(requestCaptor.getValue().getHeaders("X-User-Id"));
        assertThat(values).containsExactly(USER_ID);
    }

    @Test
    void doFilterInternalShouldDelegateNonXUserHeadersToOriginalRequestWhenValidBearerToken() throws Exception {

        when(jwtProperties.getSecret()).thenReturn(SECRET);
        when(request.getHeader(HttpHeaders.AUTHORIZATION)).thenReturn("Bearer " + generateValidToken());
        when(request.getHeaders("Content-Type"))
                .thenReturn(Collections.enumeration(List.of("application/json")));

        jwtFilter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(requestCaptor.capture(), any());
        var contentTypes = Collections.list(requestCaptor.getValue().getHeaders("Content-Type"));
        assertThat(contentTypes).containsExactly("application/json");
    }

    @Test
    void doFilterInternalShouldPreserveOriginalHeaderNamesAlongsideXUserHeadersWhenValidBearerToken() throws Exception {

        when(jwtProperties.getSecret()).thenReturn(SECRET);
        when(request.getHeader(HttpHeaders.AUTHORIZATION)).thenReturn("Bearer " + generateValidToken());
        when(request.getHeaderNames()).thenReturn(Collections.enumeration(List.of("Content-Type", "Accept")));

        jwtFilter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(requestCaptor.capture(), any());
        var headerNames = Collections.list(requestCaptor.getValue().getHeaderNames());
        assertThat(headerNames).contains("Content-Type", "Accept", "X-User-Id", "X-User-Email", "X-User-Admin");
    }


    @Test
    void doFilterInternalShouldClearSecurityContextAndPassRequestThroughWhenInvalidToken() throws Exception {

        when(jwtProperties.getSecret()).thenReturn(SECRET);
        when(request.getHeader(HttpHeaders.AUTHORIZATION)).thenReturn("Bearer not.a.valid.jwt");

        jwtFilter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    @Test
    void doFilterInternalShouldClearSecurityContextAndPassRequestThroughWhenExpiredToken() throws Exception {

        when(jwtProperties.getSecret()).thenReturn(SECRET);

        var key = Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8));
        var expiredToken = Jwts.builder()
                .subject(USER_ID)
                .expiration(new Date(System.currentTimeMillis() - 1_000))
                .signWith(key)
                .compact();
        when(request.getHeader(HttpHeaders.AUTHORIZATION)).thenReturn("Bearer " + expiredToken);

        jwtFilter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    @Test
    void doFilterInternalShouldClearSecurityContextAndPassRequestThroughWhenTokenSignedWithWrongSecret() throws Exception {

        when(jwtProperties.getSecret()).thenReturn(SECRET);

        var wrongKey = Keys.hmacShaKeyFor("WrongSecretKey00000000000000000000000000000=".getBytes(StandardCharsets.UTF_8));
        var tokenWithWrongSecret = Jwts.builder()
                .subject(USER_ID)
                .expiration(new Date(System.currentTimeMillis() + 3_600_000))
                .signWith(wrongKey)
                .compact();
        when(request.getHeader(HttpHeaders.AUTHORIZATION)).thenReturn("Bearer " + tokenWithWrongSecret);

        jwtFilter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }
}
