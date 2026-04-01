package com.thecuratedcrate.shop.repository;

import com.thecuratedcrate.shop.entity.Subscription;
import com.thecuratedcrate.shop.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {
    Optional<Subscription> findByUser(User user);
    Optional<Subscription> findByUserAndStatus(User user, Subscription.Status status);
}

