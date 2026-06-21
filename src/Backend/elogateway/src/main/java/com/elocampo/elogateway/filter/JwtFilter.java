package com.elocampo.elogateway.filter;

import com.elocampo.elogateway.config.JwtProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.NonNull;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Enumeration;
import java.util.List;

// Filtro executado uma única vez por requisição (OncePerRequestFilter).
// É registrado antes do UsernamePasswordAuthenticationFilter na cadeia do Spring Security.
@Component
@RequiredArgsConstructor
public class JwtFilter extends OncePerRequestFilter {

    private final JwtProperties jwtProperties;

    @Override
    protected void doFilterInternal(HttpServletRequest request, @NonNull HttpServletResponse response, @NonNull FilterChain filterChain)
            throws ServletException, IOException {

        var authHeader = request.getHeader(HttpHeaders.AUTHORIZATION);

        // Se não há header Authorization ou não é Bearer, deixa a requisição seguir normalmente.
        // O Spring Security vai bloqueá-la se o endpoint exigir autenticação.
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        // Remove o prefixo "Bearer " para obter somente o token.
        var token = authHeader.substring(7);

        try {

            // Valida a assinatura do token usando a chave secreta configurada em token.secret.
            var key = Keys.hmacShaKeyFor(jwtProperties.getSecret().getBytes(StandardCharsets.UTF_8));
            var claims = Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

            // Registra o usuário autenticado no contexto do Spring Security para que o
            // SecurityConfig reconheça a requisição como autenticada.
            var authentication = new UsernamePasswordAuthenticationToken(
                    claims.getSubject(), null, java.util.Collections.emptyList()
            );
            SecurityContextHolder.getContext().setAuthentication(authentication);

            // Encaminha a requisição com os headers X-User-* injetados a partir dos claims do token.
            filterChain.doFilter(new UserHeaderRequestWrapper(request, claims), response);
        } catch (JwtException e) {
            // Token inválido ou expirado: limpa o contexto e deixa a requisição prosseguir sem
            // autenticação. O Spring Security vai rejeitar com 401 se o endpoint for protegido.
            SecurityContextHolder.clearContext();
            filterChain.doFilter(request, response);
        }
    }

    // Wrapper que sobrescreve os métodos de leitura de headers para injetar as informações
    // do usuário autenticado sem modificar a requisição original.
    private static class UserHeaderRequestWrapper extends HttpServletRequestWrapper {

        private final Claims claims;

        UserHeaderRequestWrapper(HttpServletRequest request, Claims claims) {
            super(request);
            this.claims = claims;
        }

        // Intercepta a leitura dos headers X-User-* e retorna os valores extraídos do token.
        // Qualquer outro header é delegado à requisição original.
        @Override
        public String getHeader(String name) {

            return switch (name.toLowerCase()) {
                case "x-user-id" -> claims.getSubject();
                case "x-user-email" -> claims.get("email", String.class);
                case "x-user-admin" -> String.valueOf(claims.get("isAdmin", Boolean.class));
                default -> super.getHeader(name);
            };
        }

        @Override
        public Enumeration<String> getHeaders(String name) {

            var value = getHeader(name);
            if (value != null && name.toLowerCase().startsWith("x-user-")) {
                return java.util.Collections.enumeration(List.of(value));
            }
            return super.getHeaders(name);
        }

        // Garante que os headers X-User-* apareçam na enumeração de nomes,
        // mesmo que não tenham sido enviados pelo cliente.
        @Override
        public Enumeration<String> getHeaderNames() {

            var names = new ArrayList<>(java.util.Collections.list(super.getHeaderNames()));
            names.add("X-User-Id");
            names.add("X-User-Email");
            names.add("X-User-Admin");
            return java.util.Collections.enumeration(names);
        }
    }
}
