package com.thecuratedcrate.shop.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_preferences")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserPreference {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(columnDefinition = "TEXT")
    private String categories;    // comma-separated

    @Column(columnDefinition = "TEXT")
    private String regions;       // comma-separated

    @Column(name = "price_range", length = 20)
    @Builder.Default
    private String priceRange = "mid";

    @Column(name = "notif_new")
    @Builder.Default
    private Boolean notifNew = true;

    @Column(name = "notif_offers")
    @Builder.Default
    private Boolean notifOffers = true;

    @Column(name = "notif_stories")
    @Builder.Default
    private Boolean notifStories = false;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}

