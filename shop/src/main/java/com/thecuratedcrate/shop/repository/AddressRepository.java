package com.thecuratedcrate.shop.repository;

import com.thecuratedcrate.shop.entity.Address;
import com.thecuratedcrate.shop.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AddressRepository extends JpaRepository<Address, Long> {
    List<Address> findByUser(User user);
    List<Address> findByUserAndIsDefaultTrue(User user);
}

