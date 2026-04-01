package com.thecuratedcrate.shop.config;

import com.thecuratedcrate.shop.entity.Artisan;
import com.thecuratedcrate.shop.entity.Product;
import com.thecuratedcrate.shop.repository.ArtisanRepository;
import com.thecuratedcrate.shop.repository.ProductRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.math.BigDecimal;
import java.util.Arrays;

@Configuration
public class DataInitializer {

    @Bean
    public CommandLineRunner loadData(ProductRepository productRepository, ArtisanRepository artisanRepository) {
        return args -> {
            if (productRepository.count() == 0) {
                // Artisan 1
                Artisan sunita = artisanRepository.findByName("Sunita Devi").orElseGet(() -> {
                    Artisan a = new Artisan();
                    a.setName("Sunita Devi");
                    a.setVillage("Madhubani, Bihar");
                    a.setAge(47);
                    a.setStory("Sunita has been painting the ancient Madhubani tradition since age 12, passed down through 6 generations of women in her family. Each wrap takes 3 weeks to complete.");
                    a.setImpact("Supports 3 artisans");
                    a.setPhotoUrl("https://images.unsplash.com/photo-1583623025817-d180a2221d0a?w=200&q=80");
                    return artisanRepository.save(a);
                });

                Product p1 = Product.builder()
                        .name("Madhubani Silk Wrap")
                        .category("Textiles")
                        .price(BigDecimal.valueOf(3200))
                        .originalPrice(BigDecimal.valueOf(4500))
                        .rating(BigDecimal.valueOf(4.9))
                        .reviews(128)
                        .imageUrl("https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&q=80")
                        .tags(Arrays.asList("handwoven", "silk", "festive"))
                        .artisan(sunita)
                        .description("Hand-painted Madhubani silk wrap featuring traditional peacock and lotus motifs. Each piece is one-of-a-kind, made on authentic Bhagalpuri silk.")
                        .badge("Bestseller")
                        .build();
                
                // Artisan 2
                Artisan rajan = artisanRepository.save(Artisan.builder()
                        .name("Rajan Mistri")
                        .village("Bastar, Chhattisgarh")
                        .age(58)
                        .story("Rajan uses the 4,000-year-old lost-wax Dhokra casting technique. No two pieces are identical \u2014 each is a meditation in metal. He is one of only 40 remaining Dhokra masters.")
                        .impact("Supports 2 artisans")
                        .photoUrl("https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=200&q=80")
                        .build());
                        
                Product p2 = Product.builder()
                        .name("Bronze Dhokra Elephant")
                        .category("Sculptures")
                        .price(BigDecimal.valueOf(5800))
                        .originalPrice(BigDecimal.valueOf(7200))
                        .rating(BigDecimal.valueOf(4.8))
                        .reviews(94)
                        .imageUrl("https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80")
                        .tags(Arrays.asList("bronze", "tribal", "decor"))
                        .artisan(rajan)
                        .description("A stunning Dhokra cast elephant in solid bronze alloy, finished by hand. A timeless piece of living heritage.")
                        .badge("Rare Craft")
                        .build();

                // Artisan 3
                Artisan yusuf = artisanRepository.save(Artisan.builder()
                        .name("Mohammad Yusuf")
                        .village("Jaipur, Rajasthan")
                        .age(43)
                        .story("Yusuf's workshop in the old city of Jaipur has produced Blue Pottery for three generations. The cobalt pigments are still sourced from the same mountains as his grandfather used.")
                        .impact("Supports 5 artisans")
                        .photoUrl("https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=200&q=80")
                        .build());

                Product p3 = Product.builder()
                        .name("Blue Pottery Tea Set")
                        .category("Pottery")
                        .price(BigDecimal.valueOf(4200))
                        .originalPrice(BigDecimal.valueOf(5500))
                        .rating(BigDecimal.valueOf(4.7))
                        .reviews(211)
                        .imageUrl("https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600&q=80")
                        .tags(Arrays.asList("pottery", "jaipur", "gifting"))
                        .artisan(yusuf)
                        .description("6-piece Blue Pottery tea set in the classic Jaipur style. Quartz-based clay fired at low temperature for that signature translucent glow.")
                        .badge("New Arrival")
                        .build();

                productRepository.saveAll(Arrays.asList(p1, p2, p3));
                System.out.println("Inserted mock product data successfully.");
            }
        };
    }
}
