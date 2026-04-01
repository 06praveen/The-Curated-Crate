package com.thecuratedcrate.shop.repository;

import com.thecuratedcrate.shop.entity.CartItem;
import com.thecuratedcrate.shop.entity.User;
import com.thecuratedcrate.shop.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface CartItemRepository extends JpaRepository<CartItem, Long> {
    List<CartItem>     findByUser(User user);
    Optional<CartItem> findByUserAndProduct(User user, Product product);
    void               deleteByUser(User user);
    long               countByUser(User user);
}

