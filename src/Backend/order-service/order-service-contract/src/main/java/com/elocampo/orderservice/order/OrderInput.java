package com.elocampo.orderservice.order;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderInput {
    @NotNull(message = "buyerAccountId is required")
    private UUID buyerAccountId;

    @NotNull(message= "sellerAccountId is required")
    private UUID sellerAccountId;

    @NotEmpty(message = "productIds is required")
    private List<OrderItem> productsIds;
}
