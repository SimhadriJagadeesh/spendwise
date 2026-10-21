package com.spendwise.service;

import com.spendwise.dto.GoalContributionRequest;
import com.spendwise.dto.GoalContributionResponse;
import com.spendwise.dto.SavingsGoalRequest;
import com.spendwise.dto.SavingsGoalResponse;
import com.spendwise.entity.GoalContribution;
import com.spendwise.entity.SavingsGoal;
import com.spendwise.entity.User;
import com.spendwise.exception.ApiException;
import com.spendwise.repository.GoalContributionRepository;
import com.spendwise.repository.SavingsGoalRepository;
import com.spendwise.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
public class SavingsGoalService {
    private final SavingsGoalRepository goalRepository;
    private final GoalContributionRepository contributionRepository;
    private final UserRepository userRepository;

    public SavingsGoalService(SavingsGoalRepository goalRepository,
                              GoalContributionRepository contributionRepository,
                              UserRepository userRepository) {
        this.goalRepository = goalRepository;
        this.contributionRepository = contributionRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<SavingsGoalResponse> list(String username) {
        return goalRepository.findByUserUsernameOrderByCreatedAtDesc(username).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public SavingsGoalResponse create(String username, SavingsGoalRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> ApiException.unauthorized("Authenticated user not found"));

        SavingsGoal goal = new SavingsGoal();
        goal.setUser(user);
        goal.setName(request.name().trim());
        goal.setTargetAmount(request.targetAmount());
        goal.setCurrentAmount(BigDecimal.ZERO);
        goal.setCurrency(request.currency().trim().toUpperCase());
        goal.setDeadline(request.deadline());
        goal.setCompleted(false);

        return toResponse(goalRepository.save(goal));
    }

    @Transactional
    public SavingsGoalResponse update(String username, Long id, SavingsGoalRequest request) {
        SavingsGoal goal = findOwned(username, id);
        goal.setName(request.name().trim());
        goal.setTargetAmount(request.targetAmount());
        goal.setCurrency(request.currency().trim().toUpperCase());
        goal.setDeadline(request.deadline());
        goal.setCompleted(currentAmount(goal).compareTo(request.targetAmount()) >= 0);
        return toResponse(goalRepository.save(goal));
    }

    @Transactional
    public void delete(String username, Long id) {
        SavingsGoal goal = findOwned(username, id);
        // Delete all contributions first (DB has ON DELETE CASCADE, but explicit
        // JPA delete keeps the persistence context consistent and avoids orphan issues).
        List<GoalContribution> contributions =
                contributionRepository.findByGoalIdOrderByContributionDateDesc(goal.getId());
        if (!contributions.isEmpty()) {
            contributionRepository.deleteAllInBatch(contributions);
        }
        goalRepository.delete(goal);
    }

    @Transactional(readOnly = true)
    public List<GoalContributionResponse> contributions(String username, Long goalId) {
        SavingsGoal goal = findOwned(username, goalId);
        return contributionRepository.findByGoalIdOrderByContributionDateDesc(goal.getId()).stream()
                .map(c -> new GoalContributionResponse(
                        c.getId(), goal.getId(), c.getAmount(), c.getContributionDate(), c.getNotes()))
                .toList();
    }

    /**
     * Records a contribution and updates the goal's running total in the same
     * transaction, so the total can never drift from its contribution rows.
     */
    @Transactional
    public SavingsGoalResponse addContribution(String username, Long goalId, GoalContributionRequest request) {
        SavingsGoal goal = findOwned(username, goalId);

        if (request.amount() == null || request.amount().signum() <= 0) {
            throw ApiException.badRequest("Contribution amount must be greater than zero");
        }

        GoalContribution contribution = new GoalContribution();
        contribution.setGoal(goal);
        contribution.setAmount(request.amount());
        contribution.setContributionDate(request.contributionDate());
        contribution.setNotes(request.notes());
        contributionRepository.save(contribution);

        // Recompute from all DB rows so the total is always accurate even if
        // currentAmount somehow drifted (e.g. direct DB edits or concurrent requests).
        BigDecimal newTotal = contributionRepository
                .findByGoalIdOrderByContributionDateDesc(goal.getId())
                .stream()
                .map(GoalContribution::getAmount)
                .reduce(BigDecimal.ZERO, (sum, amt) -> amt == null ? sum : sum.add(amt));
        goal.setCurrentAmount(newTotal);
        BigDecimal target = goal.getTargetAmount() == null ? BigDecimal.ZERO : goal.getTargetAmount();
        goal.setCompleted(newTotal.compareTo(target) >= 0);

        return toResponse(goalRepository.save(goal));
    }

    @Transactional(readOnly = true)
    public SavingsGoalResponse getOne(String username, Long id) {
        return toResponse(findOwned(username, id));
    }

    private SavingsGoal findOwned(String username, Long id) {
        return goalRepository.findByIdAndUserUsername(id, username)
                .orElseThrow(() -> ApiException.notFound("Savings goal not found"));
    }

    /**
     * The running total, read defensively: a goal row written before the column
     * existed can hold NULL, and a NULL here would surface as a 500.
     */
    private BigDecimal currentAmount(SavingsGoal goal) {
        BigDecimal current = goal.getCurrentAmount();
        return current == null ? BigDecimal.ZERO : current;
    }

    private SavingsGoalResponse toResponse(SavingsGoal goal) {
        BigDecimal target = goal.getTargetAmount() == null ? BigDecimal.ZERO : goal.getTargetAmount();
        BigDecimal current = currentAmount(goal);
        BigDecimal remaining = target.subtract(current);
        BigDecimal percent = target.signum() == 0
                ? BigDecimal.ZERO
                : current.multiply(BigDecimal.valueOf(100)).divide(target, 2, RoundingMode.HALF_UP);
        return new SavingsGoalResponse(
                goal.getId(),
                goal.getName(),
                target,
                current,
                remaining,
                percent,
                goal.getCurrency(),
                goal.getDeadline(),
                goal.isCompleted());
    }
}
