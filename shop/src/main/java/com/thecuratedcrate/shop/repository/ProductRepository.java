package com.thecuratedcrate.shop.repository;

import com.thecuratedcrate.shop.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    List<Product> findByCategoryIgnoreCase(String category);

    List<Product> findByInStockTrue();

    @Query("""
        SELECT p FROM Product p
        WHERE (:category IS NULL OR LOWER(p.category) = LOWER(:category))
          AND (:minPrice IS NULL OR p.price >= :minPrice)
          AND (:maxPrice IS NULL OR p.price <= :maxPrice)
          AND (:minRating IS NULL OR p.rating >= :minRating)
    """)
    List<Product> findWithFilters(
            @Param("category")  String category,
            @Param("minPrice")  BigDecimal minPrice,
            @Param("maxPrice")  BigDecimal maxPrice,
            @Param("minRating") BigDecimal minRating
    );

    @Query("""
        SELECT DISTINCT p FROM Product p
        LEFT JOIN p.artisan a
        WHERE LOWER(p.name) LIKE LOWER(CONCAT('%',:query,'%'))
           OR LOWER(p.category) LIKE LOWER(CONCAT('%',:query,'%'))
           OR LOWER(CAST(p.description AS string)) LIKE LOWER(CONCAT('%',:query,'%'))
           OR LOWER(a.name) LIKE LOWER(CONCAT('%',:query,'%'))
           OR LOWER(a.village) LIKE LOWER(CONCAT('%',:query,'%'))
    """)
    List<Product> searchProducts(@Param("query") String query);

    @Query("SELECT DISTINCT p.category FROM Product p ORDER BY p.category")
    List<String> findDistinctCategories();
}

