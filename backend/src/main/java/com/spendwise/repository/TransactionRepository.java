package com.spendwise.repository;

import com.spendwise.entity.Transaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    List<Transaction> findByUserUsernameAndCurrency(String username, String currency);

    @Query("""
            select t from Transaction t
            where t.user.username = :username
              and (:currency is null or t.currency = :currency)
              and (:fromDate is null or t.transactionDate >= :fromDate)
              and (:toDate is null or t.transactionDate <= :toDate)
            order by t.transactionDate desc, t.id desc
            """)
    List<Transaction> findForExport(@Param("username") String username,
                                     @Param("currency") String currency,
                                     @Param("fromDate") LocalDate fromDate,
                                     @Param("toDate") LocalDate toDate);

    Optional<Transaction> findByIdAndUserUsername(Long id, String username);

    @Query("""
            select t from Transaction t
            where t.user.username = :username
              and (:type is null or t.type = :type)
              and (:currency is null or t.currency = :currency)
              and (:fromDate is null or t.transactionDate >= :fromDate)
              and (:toDate is null or t.transactionDate <= :toDate)
              and (:search is null or lower(t.description) like lower(concat('%', :search, '%'))
                                     or lower(t.merchant) like lower(concat('%', :search, '%')))
            """)
    Page<Transaction> search(@Param("username") String username,
                             @Param("type") String type,
                             @Param("currency") String currency,
                             @Param("fromDate") LocalDate fromDate,
                             @Param("toDate") LocalDate toDate,
                             @Param("search") String search,
                             Pageable pageable);

    @Query("""
            select t from Transaction t
            where (:search is null or lower(t.description) like lower(concat('%', :search, '%'))
                                   or lower(t.merchant) like lower(concat('%', :search, '%'))
                                   or lower(t.user.username) like lower(concat('%', :search, '%'))
                                   or lower(t.user.email) like lower(concat('%', :search, '%')))
              and (:type is null or t.type = :type)
            order by t.transactionDate desc, t.id desc
            """)
    Page<Transaction> findAllAdmin(@Param("search") String search,
                                  @Param("type") String type,
                                  Pageable pageable);

    List<Transaction> findByUserUsernameOrderByTransactionDateDesc(String username);

    @Query("""
            select coalesce(sum(t.amount), 0) from Transaction t
            where t.user.username = :username
              and t.type = :type
              and (:currency is null or t.currency = :currency)
              and t.transactionDate >= :fromDate
              and t.transactionDate <= :toDate
            """)
    BigDecimal sumByType(@Param("username") String username,
                         @Param("type") String type,
                         @Param("currency") String currency,
                         @Param("fromDate") LocalDate fromDate,
                         @Param("toDate") LocalDate toDate);

    /**
     * The same total, but restricted to one category.
     * <p>
     * This is a separate query rather than a nullable filter on the query above:
     * a {@code :categoryId is null or ...} condition would have to reference
     * {@code t.category.id}, which Hibernate renders as an implicit join and can
     * silently drop the transactions that have no category at all.
     */
    @Query("""
            select coalesce(sum(t.amount), 0) from Transaction t
            where t.user.username = :username
              and t.type = :type
              and t.currency = :currency
              and t.transactionDate >= :fromDate
              and t.transactionDate <= :toDate
              and t.category.id = :categoryId
            """)
    BigDecimal sumByTypeAndCategory(@Param("username") String username,
                                    @Param("type") String type,
                                    @Param("currency") String currency,
                                    @Param("fromDate") LocalDate fromDate,
                                    @Param("toDate") LocalDate toDate,
                                    @Param("categoryId") Long categoryId);
}
