package com.thecuratedcrate.shop.controller;

import com.thecuratedcrate.shop.entity.*;
import com.thecuratedcrate.shop.repository.CartItemRepository;
import com.thecuratedcrate.shop.repository.OrderRepository;
import com.thecuratedcrate.shop.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderRepository orderRepository;
    private final CartItemRepository cartItemRepository;
    private final UserRepository userRepository;

    public OrderController(OrderRepository orderRepository, 
                           CartItemRepository cartItemRepository, 
                           UserRepository userRepository) {
        this.orderRepository = orderRepository;
        this.cartItemRepository = cartItemRepository;
        this.userRepository = userRepository;
    }

    @PostMapping("/checkout")
    @Transactional
    public ResponseEntity<?> placeOrder(@RequestBody Map<String, Object> payload, Authentication authentication) {
        if (authentication == null) return ResponseEntity.status(401).body("Not authenticated");
        
        User user = userRepository.findByEmail(authentication.getName()).orElse(null);
        if (user == null) return ResponseEntity.status(401).build();

        List<CartItem> cartItems = cartItemRepository.findByUser(user);
        if (cartItems.isEmpty()) {
            return ResponseEntity.badRequest().body("Cart is empty");
        }

        Order order = new Order();
        order.setUser(user);
        order.setOrderNumber("TCC" + System.currentTimeMillis());
        
        // Very basic extraction of total just for stubbing
        BigDecimal total = new BigDecimal(payload.getOrDefault("total", "0").toString());
        order.setTotal(total);
        
        order.setStatus(Order.OrderStatus.CONFIRMED);
        
        List<OrderItem> orderItems = cartItems.stream().map(cartItem -> {
            OrderItem item = new OrderItem();
            item.setOrder(order);
            item.setProduct(cartItem.getProduct());
            item.setName(cartItem.getProduct().getName());
            item.setImageUrl(cartItem.getProduct().getImageUrl());
            item.setQuantity(cartItem.getQuantity());
            item.setPrice(cartItem.getProduct().getPrice());
            return item;
        }).collect(Collectors.toList());
        
        order.setItems(orderItems);
        orderRepository.save(order);

        // Clear cart
        cartItemRepository.deleteByUser(user);

        return ResponseEntity.ok(order);
    }
}
