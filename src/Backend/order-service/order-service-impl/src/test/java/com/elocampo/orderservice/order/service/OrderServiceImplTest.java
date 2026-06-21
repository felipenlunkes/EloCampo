package com.elocampo.orderservice.order.service;

import com.elocampo.accountservice.account.AccountResponse;
import com.elocampo.accountservice.account.AccountRole;
import com.elocampo.orderservice.config.client.AccountServiceClient;
import com.elocampo.orderservice.exceptions.NotFoundException;
import com.elocampo.orderservice.exceptions.ValidationErrorException;
import com.elocampo.orderservice.order.*;
import com.elocampo.orderservice.order.entity.Order;
import com.elocampo.orderservice.order.entity.OrderHistory;
import com.elocampo.orderservice.order.entity.OrderItemEmbedded;
import com.elocampo.orderservice.order.repository.OrderRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderServiceImplTest {

    @Mock
    private AccountServiceClient accountServiceClient;

    @Mock
    private OrderRepository orderRepository;

    @InjectMocks
    private OrderServiceImpl orderService;

    private UUID buyerAccountId;
    private UUID sellerAccountId;
    private OrderInput validInput;
    private AccountResponse buyerAccountResponse;
    private Order savedOrder;

    @BeforeEach
    void setUp() {

        buyerAccountId = UUID.randomUUID();
        sellerAccountId = UUID.randomUUID();

        var item1 = new OrderItem(UUID.randomUUID(), "Tomate orgânico", new BigDecimal("2"), new BigDecimal("12.50"));
        var item2 = new OrderItem(UUID.randomUUID(), "Alface crespa", new BigDecimal("3"), new BigDecimal("4.00"));

        validInput = new OrderInput(buyerAccountId, sellerAccountId, List.of(item1, item2));

        buyerAccountResponse = new AccountResponse();
        buyerAccountResponse.setId(buyerAccountId);
        buyerAccountResponse.setRole(AccountRole.BUYER);

        var embedded1 = new OrderItemEmbedded(item1.getProductId().toString(), item1.getDescription(), item1.getQuantity(), item1.getPrice());
        var embedded2 = new OrderItemEmbedded(item2.getProductId().toString(), item2.getDescription(), item2.getQuantity(), item2.getPrice());

        savedOrder = Order.builder()
                .id(UUID.randomUUID().toString())
                .buyerAccountId(buyerAccountId.toString())
                .sellerAccountId(sellerAccountId.toString())
                .status(OrderStatus.PENDING)
                .products(Set.of(embedded1, embedded2))
                .price(new BigDecimal("37.00"))
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
    }

    @Test
    void createSavesAndReturnsResponse() {

        when(accountServiceClient.findAccountById(buyerAccountId)).thenReturn(buyerAccountResponse);
        when(orderRepository.save(any(Order.class))).thenReturn(savedOrder);

        var result = orderService.create(validInput);

        assertThat(result).isNotNull();
        assertThat(result.getBuyerAccountId()).isEqualTo(buyerAccountId);
        assertThat(result.getSellerAccountId()).isEqualTo(sellerAccountId);
        assertThat(result.getOrderStatus()).isEqualTo(OrderStatus.PENDING);
        assertThat(result.getProducts()).hasSize(2);
        verify(orderRepository).save(any(Order.class));
    }

    @Test
    void createCalculatesTotalPriceCorrectly() {

        when(accountServiceClient.findAccountById(buyerAccountId)).thenReturn(buyerAccountResponse);
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> {
            Order order = invocation.getArgument(0);
            return Order.builder()
                    .id(UUID.randomUUID().toString())
                    .buyerAccountId(order.getBuyerAccountId())
                    .sellerAccountId(order.getSellerAccountId())
                    .status(order.getStatus())
                    .products(order.getProducts())
                    .price(order.getPrice())
                    .createdAt(order.getCreatedAt())
                    .updatedAt(order.getUpdatedAt())
                    .build();
        });

        var result = orderService.create(validInput);

        // item1: 2 * 12.50 = 25.00 | item2: 3 * 4.00 = 12.00 | total = 37.00
        assertThat(result.getPrice()).isEqualByComparingTo(new BigDecimal("37.00"));
    }

    @Test
    void createWhenAccountIsNotBuyerThrowsValidationErrorException() {

        buyerAccountResponse.setRole(AccountRole.VENDOR);
        when(accountServiceClient.findAccountById(buyerAccountId)).thenReturn(buyerAccountResponse);

        assertThatThrownBy(() -> orderService.create(validInput))
                .isInstanceOf(ValidationErrorException.class)
                .hasMessageContaining("account is not a customer");

        verify(orderRepository, never()).save(any());
    }

    @Test
    void createSetsStatusAsPending() {

        when(accountServiceClient.findAccountById(buyerAccountId)).thenReturn(buyerAccountResponse);
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> {
            Order order = invocation.getArgument(0);
            return Order.builder()
                    .id(UUID.randomUUID().toString())
                    .buyerAccountId(order.getBuyerAccountId())
                    .sellerAccountId(order.getSellerAccountId())
                    .status(order.getStatus())
                    .products(order.getProducts())
                    .price(order.getPrice())
                    .createdAt(order.getCreatedAt())
                    .updatedAt(order.getUpdatedAt())
                    .build();
        });

        var result = orderService.create(validInput);

        assertThat(result.getOrderStatus()).isEqualTo(OrderStatus.PENDING);
    }

    @Test
    void createMapsProductsFromInputToEmbedded() {

        when(accountServiceClient.findAccountById(buyerAccountId)).thenReturn(buyerAccountResponse);
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> {
            Order order = invocation.getArgument(0);
            return Order.builder()
                    .id(UUID.randomUUID().toString())
                    .buyerAccountId(order.getBuyerAccountId())
                    .sellerAccountId(order.getSellerAccountId())
                    .status(order.getStatus())
                    .products(order.getProducts())
                    .price(order.getPrice())
                    .createdAt(order.getCreatedAt())
                    .updatedAt(order.getUpdatedAt())
                    .build();
        });

        var result = orderService.create(validInput);

        assertThat(result.getProducts()).hasSize(2);
        assertThat(result.getProducts())
                .map(OrderItem::getDescription)
                .containsExactlyInAnyOrder("Tomate orgânico", "Alface crespa");
    }

    @Test
    void findByIdWhenOrderExistsReturnsOrderResponse() {

        var orderId = UUID.fromString(savedOrder.getId());

        when(orderRepository.findById(savedOrder.getId())).thenReturn(Optional.of(savedOrder));

        var result = orderService.findById(orderId);

        assertThat(result).isPresent();
        assertThat(result.get().getId()).isEqualTo(orderId);
        assertThat(result.get().getBuyerAccountId()).isEqualTo(buyerAccountId);
        assertThat(result.get().getSellerAccountId()).isEqualTo(sellerAccountId);
        assertThat(result.get().getOrderStatus()).isEqualTo(OrderStatus.PENDING);
    }

    @Test
    void findByIdWhenOrderNotFoundReturnsEmptyOptional() {

        var orderId = UUID.randomUUID();

        when(orderRepository.findById(orderId.toString())).thenReturn(Optional.empty());

        var result = orderService.findById(orderId);

        assertThat(result).isEmpty();
    }

    @Test
    void findByIdWhenIdIsNullThrowsValidationErrorException() {

        assertThatThrownBy(() -> orderService.findById(null))
                .isInstanceOf(ValidationErrorException.class)
                .hasMessageContaining("id is required");

        verifyNoInteractions(orderRepository);
    }

    @Test
    void changeStatusFromPendingToAcceptedSavesOrder() {

        var orderId = UUID.fromString(savedOrder.getId());
        var input = buildInput(OrderStatus.ACCEPTED, "Pedido aceito pelo vendedor");

        when(orderRepository.findById(savedOrder.getId())).thenReturn(Optional.of(savedOrder));

        orderService.changeStatus(orderId, input);

        verify(orderRepository).save(savedOrder);
    }

    @Test
    void changeStatusFromPendingToCompletedSavesOrder() {

        var orderId = UUID.fromString(savedOrder.getId());
        var input = buildInput(OrderStatus.COMPLETED, "Pedido entregue ao comprador");

        when(orderRepository.findById(savedOrder.getId())).thenReturn(Optional.of(savedOrder));

        orderService.changeStatus(orderId, input);

        verify(orderRepository).save(savedOrder);
    }

    @Test
    void changeStatusFromAcceptedToCompletedSavesOrder() {

        savedOrder.setStatus(OrderStatus.ACCEPTED);
        var orderId = UUID.fromString(savedOrder.getId());
        var input = buildInput(OrderStatus.COMPLETED, "Pedido entregue ao comprador");

        when(orderRepository.findById(savedOrder.getId())).thenReturn(Optional.of(savedOrder));

        orderService.changeStatus(orderId, input);

        verify(orderRepository).save(savedOrder);
    }

    @Test
    void changeStatusAddsHistoryEntryWithCorrectFields() {

        savedOrder.setHistory(null);
        var orderId = UUID.fromString(savedOrder.getId());
        var input = buildInput(OrderStatus.ACCEPTED, "Pedido aceito pelo vendedor");

        when(orderRepository.findById(savedOrder.getId())).thenReturn(Optional.of(savedOrder));

        var captor = ArgumentCaptor.forClass(Order.class);
        when(orderRepository.save(captor.capture())).thenReturn(savedOrder);

        orderService.changeStatus(orderId, input);

        var saved = captor.getValue();
        assertThat(saved.getHistory()).hasSize(1);

        OrderHistory entry = saved.getHistory().iterator().next();
        assertThat(entry.getStatus()).isEqualTo(OrderStatus.ACCEPTED);
        assertThat(entry.getType()).isEqualTo(OrderHistoryType.STATUS_CHANGE);
        assertThat(entry.getNote()).isEqualTo("Pedido aceito pelo vendedor");
        assertThat(entry.getId()).isNotNull();
        assertThat(entry.getCreatedAt()).isNotNull();
    }

    @Test
    void changeStatusInitializesHistoryWhenNull() {

        savedOrder.setHistory(null);
        var orderId = UUID.fromString(savedOrder.getId());
        var input = buildInput(OrderStatus.ACCEPTED, "Pedido aceito pelo vendedor");

        when(orderRepository.findById(savedOrder.getId())).thenReturn(Optional.of(savedOrder));

        orderService.changeStatus(orderId, input);

        assertThat(savedOrder.getHistory()).isNotNull().hasSize(1);
    }

    @Test
    void changeStatusUpdatesUpdatedAt() {

        var beforeCall = Instant.now();
        savedOrder.setHistory(null);
        var orderId = UUID.fromString(savedOrder.getId());
        var input = buildInput(OrderStatus.ACCEPTED, "Pedido aceito pelo vendedor");

        when(orderRepository.findById(savedOrder.getId())).thenReturn(Optional.of(savedOrder));

        var captor = ArgumentCaptor.forClass(Order.class);
        when(orderRepository.save(captor.capture())).thenReturn(savedOrder);

        orderService.changeStatus(orderId, input);

        assertThat(captor.getValue().getUpdatedAt()).isAfterOrEqualTo(beforeCall);
    }

    @Test
    void changeStatusWhenOrderNotFoundThrowsNotFoundException() {

        var orderId = UUID.randomUUID();
        var input = buildInput(OrderStatus.ACCEPTED, "Pedido aceito pelo vendedor");

        when(orderRepository.findById(orderId.toString())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> orderService.changeStatus(orderId, input))
                .isInstanceOf(NotFoundException.class)
                .hasMessageContaining("order not found");

        verify(orderRepository, never()).save(any());
    }

    @Test
    void changeStatusWhenCurrentStatusIsCompletedThrowsValidationError() {

        savedOrder.setStatus(OrderStatus.COMPLETED);
        var orderId = UUID.fromString(savedOrder.getId());
        var input = buildInput(OrderStatus.COMPLETED, "Tentativa inválida de nova conclusão");

        when(orderRepository.findById(savedOrder.getId())).thenReturn(Optional.of(savedOrder));

        assertThatThrownBy(() -> orderService.changeStatus(orderId, input))
                .isInstanceOf(ValidationErrorException.class)
                .hasMessageContaining("Cannot change status from COMPLETED");

        verify(orderRepository, never()).save(any());
    }

    @Test
    void changeStatusWhenTransitionIsInvalidThrowsValidationError() {

        var orderId = UUID.fromString(savedOrder.getId());
        var input = buildInput(OrderStatus.PENDING, "Tentativa de volta para pendente");

        when(orderRepository.findById(savedOrder.getId())).thenReturn(Optional.of(savedOrder));

        assertThatThrownBy(() -> orderService.changeStatus(orderId, input))
                .isInstanceOf(ValidationErrorException.class)
                .hasMessageContaining("Cannot change status to PENDING");

        verify(orderRepository, never()).save(any());
    }

    @Test
    void findByBuyerAccountIdReturnsMappedPage() {

        var pageable = PageRequest.of(0, 20);
        var page = new org.springframework.data.domain.PageImpl<>(List.of(savedOrder), pageable, 1);

        when(orderRepository.findByBuyerAccountId(buyerAccountId.toString(), pageable)).thenReturn(page);

        var result = orderService.findByBuyerAccountId(buyerAccountId, pageable);

        assertThat(result).isNotNull();
        assertThat(result.getTotalElements()).isEqualTo(1);
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().getFirst().getBuyerAccountId()).isEqualTo(buyerAccountId);
        verify(orderRepository).findByBuyerAccountId(buyerAccountId.toString(), pageable);
    }

    @Test
    void findByBuyerAccountIdWhenNoOrdersReturnsEmptyPage() {

        var pageable = PageRequest.of(0, 20);
        var emptyPage = new org.springframework.data.domain.PageImpl<Order>(List.of(), pageable, 0);

        when(orderRepository.findByBuyerAccountId(buyerAccountId.toString(), pageable)).thenReturn(emptyPage);

        var result = orderService.findByBuyerAccountId(buyerAccountId, pageable);

        assertThat(result).isNotNull();
        assertThat(result.getTotalElements()).isZero();
        assertThat(result.getContent()).isEmpty();
    }

    @Test
    void findBySellerAccountIdReturnsMappedPage() {

        var pageable = PageRequest.of(0, 20);
        var page = new org.springframework.data.domain.PageImpl<>(List.of(savedOrder), pageable, 1);

        when(orderRepository.findBySellerAccountId(sellerAccountId.toString(), pageable)).thenReturn(page);

        var result = orderService.findBySellerAccountId(sellerAccountId, pageable);

        assertThat(result).isNotNull();
        assertThat(result.getTotalElements()).isEqualTo(1);
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().getFirst().getSellerAccountId()).isEqualTo(sellerAccountId);
        verify(orderRepository).findBySellerAccountId(sellerAccountId.toString(), pageable);
    }

    @Test
    void findBySellerAccountIdWhenNoOrdersReturnsEmptyPage() {

        var pageable = PageRequest.of(0, 20);
        var emptyPage = new org.springframework.data.domain.PageImpl<Order>(List.of(), pageable, 0);

        when(orderRepository.findBySellerAccountId(sellerAccountId.toString(), pageable)).thenReturn(emptyPage);

        var result = orderService.findBySellerAccountId(sellerAccountId, pageable);

        assertThat(result).isNotNull();
        assertThat(result.getTotalElements()).isZero();
        assertThat(result.getContent()).isEmpty();
    }

    private OrderStatusChangeInput buildInput(OrderStatus status, String note) {

        var input = new OrderStatusChangeInput();
        input.setStatus(status);
        input.setNote(note);

        return input;
    }
}