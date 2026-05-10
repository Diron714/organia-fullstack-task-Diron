package com.organia.taskmanager.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class DashboardPreferences {
  private boolean showStatsCards = true;
  private boolean showCharts = true;
  private boolean showOverdueBanner = true;
  private boolean showRecentActivity = true;
  private boolean showProductivityScore = true;
  private boolean showStreakCard = true;

  public boolean isShowStatsCards() {
    return showStatsCards;
  }

  public void setShowStatsCards(boolean showStatsCards) {
    this.showStatsCards = showStatsCards;
  }

  public boolean isShowCharts() {
    return showCharts;
  }

  public void setShowCharts(boolean showCharts) {
    this.showCharts = showCharts;
  }

  public boolean isShowOverdueBanner() {
    return showOverdueBanner;
  }

  public void setShowOverdueBanner(boolean showOverdueBanner) {
    this.showOverdueBanner = showOverdueBanner;
  }

  public boolean isShowRecentActivity() {
    return showRecentActivity;
  }

  public void setShowRecentActivity(boolean showRecentActivity) {
    this.showRecentActivity = showRecentActivity;
  }

  public boolean isShowProductivityScore() {
    return showProductivityScore;
  }

  public void setShowProductivityScore(boolean showProductivityScore) {
    this.showProductivityScore = showProductivityScore;
  }

  public boolean isShowStreakCard() {
    return showStreakCard;
  }

  public void setShowStreakCard(boolean showStreakCard) {
    this.showStreakCard = showStreakCard;
  }
}
