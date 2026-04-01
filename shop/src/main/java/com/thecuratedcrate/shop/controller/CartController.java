package com.thecuratedcrate.shop.controller;

import com.thecuratedcrate.shop.entity.CartItem;
import com.thecuratedcrate.shop.entity.Product;
import com.thecuratedcrate.shop.entity.User;
import com.thecuratedcrate.shop.repository.CartItemRepository;
import com.thecuratedcrate.shop.repository.ProductRepository;
import com.thecuratedcrate.shop.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/cart")
public class CartController {

    private final CartItemRepository cartItemRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    public CartController(CartItemRepository cartItemRepository, 
                          UserRepository userRepository, 
                          ProductRepository productRepository) {
        this.cartItemRepository = cartItemRepository;
        this.userRepository = userRepository;
        this.productRepository = productRepository;
    }

    private User getAuthenticatedUser(Authentication authentication) {
        if (authentication == null) return null;
        return userRepository.findByEmail(authentication.getName()).orElse(null);
    }

    @GetMapping
    public ResponseEntity<List<CartItem>> getCart(Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        if (user == null) return ResponseEntity.status(401).build();

        return ResponseEntity.ok(cartItemRepository.findByUser(user));
    }

    @PostMapping
    public ResponseEntity<?> addToCart(@RequestBody Map<String, Object> payload, Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        if (user == null) return ResponseEntity.status(401).body("Not authenticated");

        Long productId = Long.valueOf(payload.get("productId").toString());
        int qty = payload.containsKey("qty") ? Integer.parseInt(payload.get("qty").toString()) : 1;

        Product product = productRepository.findById(productId).orElse(null);
        if (product == null) return ResponseEntity.badRequest().body("Product not found");

        Optional<CartItem> existing = cartItemRepository.findByUserAndProduct(user, product);
        if (existing.isPresent()) {
            CartItem item = existing.get();
            item.setQuantity(item.getQuantity() + qty);
            cartItemRepository.save(item);
        } else {
            CartItem item = new CartItem();
            item.setUser(user);
            item.setProduct(product);
            item.setQuantity(qty);
            cartItemRepository.save(item);
        }

        return ResponseEntity.ok(cartItemRepository.findByUser(user));
    }

    @PatchMapping("/{productId}")
    public ResponseEntity<?> updateCartQty(@PathVariable Long productId, @RequestBody Map<String, Integer> payload, Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        if (user == null) return ResponseEntity.status(401).build();

        int qty = payload.get("qty");
        Product product = productRepository.findById(productId).orElse(null);
        if (product == null) return ResponseEntity.badRequest().body("Product not found");

        Optional<CartItem> itemOpt = cartItemRepository.findByUserAndProduct(user, product);
        if (itemOpt.isPresent()) {
            CartItem item = itemOpt.get();
            item.setQuantity(Math.max(1, qty));
            cartItemRepository.save(item);
        }

        return ResponseEntity.ok(cartItemRepository.findByUser(user));
    }

    @DeleteMapping("/{productId}")
    public ResponseEntity<?> removeFromCart(@PathVariable Long productId, Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        if (user == null) return ResponseEntity.status(401).build();

        Product product = productRepository.findById(productId).orElse(null);
        if (product != null) {
            cartItemRepository.findByUserAndProduct(user, product).ifPresent(cartItemRepository::delete);
        }

        return ResponseEntity.ok().build();
    }

    @DeleteMapping
    public ResponseEntity<?> clearCart(Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        if (user == null) return ResponseEntity.status(401).build();

        cartItemRepository.deleteByUser(user);
        return ResponseEntity.ok().build();
    }
}
