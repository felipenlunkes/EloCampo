package com.elocampo.orderservice.order.controller;

import com.elocampo.orderservice.order.OrderResponse;
import com.elocampo.orderservice.order.OrderStatus;
import com.elocampo.orderservice.order.service.OrderService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.web.PageableHandlerMethodArgumentResolver;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class OrderControllerTest {

    @Mock
    private OrderService orderService;

    @InjectMocks
    private OrderController orderController;

    private MockMvc mockMvc;

    private UUID buyerAccountId;
    private UUID sellerAccountId;
    private OrderResponse orderResponse;

    @BeforeEach
    void setUp() {

        mockMvc = MockMvcBuilders.standaloneSetup(orderController)
                .setCustomArgumentResolvers(new PageableHandlerMethodArgumentResolver())
                .build();

        buyerAccountId = UUID.randomUUID();
        sellerAccountId = UUID.randomUUID();

        orderResponse = new OrderResponse();
        orderResponse.setId(UUID.randomUUID());
        orderResponse.setBuyerAccountId(buyerAccountId);
        orderResponse.setSellerAccountId(sellerAccountId);
        orderResponse.setOrderStatus(OrderStatus.PENDING);
        orderResponse.setPrice(new BigDecimal("37.00"));
        orderResponse.setCreatedAt(Instant.now().toEpochMilli());
        orderResponse.setUpdatedAt(Instant.now().toEpochMilli());
        orderResponse.setProducts(List.of());
    }

    @Test
    void findByBuyerReturns200WithPage() throws Exception {

        var pageable = PageRequest.of(0, 20);
        var page = new PageImpl<>(List.of(orderResponse), pageable, 1);

        when(orderService.findByBuyerAccountId(eq(buyerAccountId), any())).thenReturn(page);

        mockMvc.perform(get("/v1/order/buyer/{buyerAccountId}", buyerAccountId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].buyerAccountId").value(buyerAccountId.toString()))
                .andExpect(jsonPath("$.content[0].orderStatus").value("PENDING"));

        verify(orderService).findByBuyerAccountId(eq(buyerAccountId), any());
    }

    @Test
    void findByBuyerWithCustomPageParamsPassesPageableToService() throws Exception {

        var page = new PageImpl<OrderResponse>(List.of(), PageRequest.of(1, 5), 0);

        when(orderService.findByBuyerAccountId(eq(buyerAccountId), any())).thenReturn(page);

        mockMvc.perform(get("/v1/order/buyer/{buyerAccountId}", buyerAccountId)
                        .param("page", "1")
                        .param("size", "5"))
                .andExpect(status().isOk());

        verify(orderService).findByBuyerAccountId(eq(buyerAccountId), eq(PageRequest.of(1, 5)));
    }

    @Test
    void findByBuyerWhenNoOrdersReturnsEmptyPage() throws Exception {

        var emptyPage = new PageImpl<OrderResponse>(List.of(), PageRequest.of(0, 20), 0);

        when(orderService.findByBuyerAccountId(eq(buyerAccountId), any())).thenReturn(emptyPage);

        mockMvc.perform(get("/v1/order/buyer/{buyerAccountId}", buyerAccountId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(0))
                .andExpect(jsonPath("$.content").isEmpty());
    }

    @Test
    void findBySellerReturns200WithPage() throws Exception {

        var pageable = PageRequest.of(0, 20);
        var page = new PageImpl<>(List.of(orderResponse), pageable, 1);

        when(orderService.findBySellerAccountId(eq(sellerAccountId), any())).thenReturn(page);

        mockMvc.perform(get("/v1/order/seller/{sellerAccountId}", sellerAccountId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].sellerAccountId").value(sellerAccountId.toString()))
                .andExpect(jsonPath("$.content[0].orderStatus").value("PENDING"));

        verify(orderService).findBySellerAccountId(eq(sellerAccountId), any());
    }

    @Test
    void findBySellerWithCustomPageParamsPassesPageableToService() throws Exception {

        var page = new PageImpl<OrderResponse>(List.of(), PageRequest.of(2, 10), 0);

        when(orderService.findBySellerAccountId(eq(sellerAccountId), any())).thenReturn(page);

        mockMvc.perform(get("/v1/order/seller/{sellerAccountId}", sellerAccountId)
                        .param("page", "2")
                        .param("size", "10"))
                .andExpect(status().isOk());

        verify(orderService).findBySellerAccountId(eq(sellerAccountId), eq(PageRequest.of(2, 10)));
    }

    @Test
    void findBySellerWhenNoOrdersReturnsEmptyPage() throws Exception {

        var emptyPage = new PageImpl<OrderResponse>(List.of(), PageRequest.of(0, 20), 0);

        when(orderService.findBySellerAccountId(eq(sellerAccountId), any())).thenReturn(emptyPage);

        mockMvc.perform(get("/v1/order/seller/{sellerAccountId}", sellerAccountId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(0))
                .andExpect(jsonPath("$.content").isEmpty());
    }
}