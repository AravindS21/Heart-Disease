package backend.repository;

import backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmailIgnoreCase(String email);

    Optional<User> findByUserId(String userId);

    boolean existsByEmailIgnoreCase(String email);

    @Modifying
    @Query(value = "CALL sp_update_last_login(:userId)", nativeQuery = true)
    void executeUpdateLastLogin(@Param("userId") String userId);
}

