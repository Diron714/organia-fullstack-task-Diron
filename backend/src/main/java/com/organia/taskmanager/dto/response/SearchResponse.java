package com.organia.taskmanager.dto.response;

import java.util.List;

public record SearchResponse(
    List<TaskSearchResult> tasks,
    List<CommentSearchResult> comments,
    List<LabelSearchResult> labels) {}
