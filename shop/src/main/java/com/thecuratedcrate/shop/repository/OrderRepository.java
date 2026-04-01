package com.thecuratedcrate.shop.repository;

import com.thecuratedcrate.shop.entity.Order;
import com.thecuratedcrate.shop.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order>     findByUserOrderByPlacedAtDesc(User user);
    Optional<Order> findByOrderNumberAndUser(String orderNumber, User user);
    long            countByUser(User user);
}

