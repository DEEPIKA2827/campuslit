# CampusLit — Production PostgreSQL Database Schema Specification (v3.0 — Senior Corrected)

## Implementation Order (for PostgreSQL)
1. USERS
2. COLLEGES
3. ACADEMIC_SCHEMES
4. COURSES
5. STUDENT_PROFILES
6. STUDENT_SETTINGS
7. ATTENDANCE_LOGS
8. ATTENDANCE_SUMMARIES
9. CIE_ASSESSMENTS
10. STUDENT_CIE_MARKS
11. PYQS
12. VIVA_QUESTIONS
13. CHAT_THREADS
14. CHAT_MESSAGES
15. SCHOLARSHIPS
16. STUDENT_SCHOLARSHIP_BOOKMARKS
17. ROADMAPS
18. ROADMAP_NODES
19. STUDENT_ROADMAP_PROGRESS
20. OPPORTUNITIES
21. STUDENT_OPPORTUNITIES

## Data Dictionary / Tables

### 1. USERS
| Column | Data Type | Key / Constraint |
|---|---|---|
| user_id | BIGINT | PK |
| email | VARCHAR(255) | UNIQUE, NOT NULL |
| password_hash | TEXT | NOT NULL |
| role | VARCHAR(30) | student/admin/faculty |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

### 2. STUDENT_PROFILES
| Column | Data Type | Key / Constraint |
|---|---|---|
| user_id | BIGINT | PK, FK → USERS.user_id |
| first_name | VARCHAR(100) | NOT NULL |
| last_name | VARCHAR(100) | NULL |
| college_id | BIGINT | FK → COLLEGES.college_id |
| course_id | BIGINT | FK → COURSES.course_id |
| semester | SMALLINT | NULL |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

### 3. STUDENT_SETTINGS
| Column | Data Type | Key / Constraint |
|---|---|---|
| user_id | BIGINT | PK, FK → USERS.user_id |
| notification_enabled | BOOLEAN | DEFAULT TRUE |
| theme | VARCHAR(20) | DEFAULT 'system' |
| language | VARCHAR(20) | DEFAULT 'en' |

### 4. COLLEGES
| Column | Data Type | Key / Constraint |
|---|---|---|
| college_id | BIGINT | PK |
| college_name | VARCHAR(255) | NOT NULL |
| location | VARCHAR(255) | NULL |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

### 5. ACADEMIC_SCHEMES
| Column | Data Type | Key / Constraint |
|---|---|---|
| scheme_id | BIGINT | PK |
| college_id | BIGINT | FK → COLLEGES.college_id |
| scheme_name | VARCHAR(100) | NOT NULL |
| academic_year | VARCHAR(20) | NULL |

### 6. COURSES
| Column | Data Type | Key / Constraint |
|---|---|---|
| course_id | BIGINT | PK |
| scheme_id | BIGINT | FK → ACADEMIC_SCHEMES.scheme_id |
| course_name | VARCHAR(255) | NOT NULL |
| course_code | VARCHAR(50) | UNIQUE |

### 7. ATTENDANCE_LOGS
| Column | Data Type | Key / Constraint |
|---|---|---|
| attendance_id | BIGINT | PK |
| user_id | BIGINT | FK → USERS.user_id |
| course_id | BIGINT | FK → COURSES.course_id |
| attendance_date | DATE | NOT NULL |
| status | VARCHAR(20) | present/absent/late |

### 8. ATTENDANCE_SUMMARIES
| Column | Data Type | Key / Constraint |
|---|---|---|
| summary_id | BIGINT | PK |
| user_id | BIGINT | FK → USERS.user_id |
| course_id | BIGINT | FK → COURSES.course_id |
| total_classes | INT | NOT NULL |
| attended_classes | INT | NOT NULL |
| attendance_percentage | DECIMAL(5,2) | NOT NULL |

### 9. CIE_ASSESSMENTS
| Column | Data Type | Key / Constraint |
|---|---|---|
| cie_id | BIGINT | PK |
| course_id | BIGINT | FK → COURSES.course_id |
| assessment_name | VARCHAR(100) | NOT NULL |
| assessment_date | DATE | NULL |
| max_marks | DECIMAL(6,2) | NOT NULL |

### 10. STUDENT_CIE_MARKS
| Column | Data Type | Key / Constraint |
|---|---|---|
| mark_id | BIGINT | PK |
| user_id | BIGINT | FK → USERS.user_id |
| cie_id | BIGINT | FK → CIE_ASSESSMENTS.cie_id |
| marks_obtained | DECIMAL(6,2) | NOT NULL |

### 11. PYQS
| Column | Data Type | Key / Constraint |
|---|---|---|
| pyq_id | BIGINT | PK |
| course_id | BIGINT | FK → COURSES.course_id |
| question | TEXT | NOT NULL |
| exam_year | SMALLINT | NULL |
| marks | DECIMAL(5,2) | NULL |
| difficulty | VARCHAR(20) | easy/medium/hard |

### 12. VIVA_QUESTIONS
| Column | Data Type | Key / Constraint |
|---|---|---|
| viva_id | BIGINT | PK |
| course_id | BIGINT | FK → COURSES.course_id |
| question | TEXT | NOT NULL |
| difficulty | VARCHAR(20) | easy/medium/hard |

### 13. CHAT_THREADS
| Column | Data Type | Key / Constraint |
|---|---|---|
| chat_id | BIGINT | PK |
| user_id | BIGINT | FK → USERS.user_id |
| title | VARCHAR(255) | NULL |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

### 14. CHAT_MESSAGES
| Column | Data Type | Key / Constraint |
|---|---|---|
| message_id | BIGINT | PK |
| chat_id | BIGINT | FK → CHAT_THREADS.chat_id |
| sender_type | VARCHAR(20) | user/assistant |
| message | TEXT | NOT NULL |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

### 15. SCHOLARSHIPS
| Column | Data Type | Key / Constraint |
|---|---|---|
| scholarship_id | BIGINT | PK |
| scholarship_name | VARCHAR(255) | NOT NULL |
| description | TEXT | NULL |
| eligibility | TEXT | NULL |
| application_url | TEXT | NULL |
| deadline | DATE | NULL |

### 16. STUDENT_SCHOLARSHIP_BOOKMARKS
| Column | Data Type | Key / Constraint |
|---|---|---|
| user_id | BIGINT | PK, FK → USERS.user_id |
| scholarship_id | BIGINT | PK, FK → SCHOLARSHIPS.scholarship_id |
| bookmarked_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

### 17. ROADMAPS
| Column | Data Type | Key / Constraint |
|---|---|---|
| roadmap_id | BIGINT | PK |
| title | VARCHAR(255) | NOT NULL |
| description | TEXT | NULL |
| career | VARCHAR(150) | NULL |

### 18. ROADMAP_NODES
| Column | Data Type | Key / Constraint |
|---|---|---|
| node_id | BIGINT | PK |
| roadmap_id | BIGINT | FK → ROADMAPS.roadmap_id |
| title | VARCHAR(255) | NOT NULL |
| description | TEXT | NULL |
| sequence_no | INT | NOT NULL |

### 19. STUDENT_ROADMAP_PROGRESS
| Column | Data Type | Key / Constraint |
|---|---|---|
| progress_id | BIGINT | PK |
| user_id | BIGINT | FK → USERS.user_id |
| roadmap_id | BIGINT | FK → ROADMAPS.roadmap_id |
| node_id | BIGINT | FK → ROADMAP_NODES.node_id |
| status | VARCHAR(20) | not_started/in_progress/completed |
| completed_at | TIMESTAMP | NULL |

### 20. OPPORTUNITIES
| Column | Data Type | Key / Constraint |
|---|---|---|
| opportunity_id | BIGINT | PK |
| title | VARCHAR(255) | NOT NULL |
| company | VARCHAR(255) | NULL |
| description | TEXT | NULL |
| application_url | TEXT | NULL |
| deadline | DATE | NULL |

### 21. STUDENT_OPPORTUNITIES
| Column | Data Type | Key / Constraint |
|---|---|---|
| user_id | BIGINT | PK, FK → USERS.user_id |
| opportunity_id | BIGINT | PK, FK → OPPORTUNITIES.opportunity_id |
| status | VARCHAR(30) | saved/applied/shortlisted/rejected |
| saved_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

## Relationships
- USERS → STUDENT_PROFILES: 1:0..1
- USERS → STUDENT_SETTINGS: 1:0..1
- COLLEGES → STUDENT_PROFILES: 1:N
- COLLEGES → ACADEMIC_SCHEMES: 1:N
- ACADEMIC_SCHEMES → COURSES: 1:N
- USERS → ATTENDANCE_LOGS: 1:N
- COURSES → ATTENDANCE_LOGS: 1:N
- USERS → ATTENDANCE_SUMMARIES: 1:N
- COURSES → ATTENDANCE_SUMMARIES: 1:N
- COURSES → CIE_ASSESSMENTS: 1:N
- USERS → STUDENT_CIE_MARKS: 1:N
- CIE_ASSESSMENTS → STUDENT_CIE_MARKS: 1:N
- COURSES → PYQS: 1:N
- COURSES → VIVA_QUESTIONS: 1:N
- USERS → CHAT_THREADS: 1:N
- CHAT_THREADS → CHAT_MESSAGES: 1:N
- USERS ↔ SCHOLARSHIPS: N:M (via STUDENT_SCHOLARSHIP_BOOKMARKS)
- ROADMAPS → ROADMAP_NODES: 1:N
- USERS → STUDENT_ROADMAP_PROGRESS: 1:N
- ROADMAP_NODES → STUDENT_ROADMAP_PROGRESS: 1:N
- USERS ↔ OPPORTUNITIES: N:M (via STUDENT_OPPORTUNITIES)

## Recommended Constraints
- `USERS.email`: UNIQUE, NOT NULL
- `COURSES.course_code`: UNIQUE
- `STUDENT_CIE_MARKS`: UNIQUE(user_id, cie_id)
- `STUDENT_SCHOLARSHIP_BOOKMARKS`: composite PK (user_id, scholarship_id)
- `STUDENT_OPPORTUNITIES`: composite PK (user_id, opportunity_id)
- `ROADMAP_NODES`: UNIQUE(roadmap_id, sequence_no)

## Validation Checklist
- [x] All Primary Keys use BIGINT.
- [x] Correct entity relationships (1:1, 1:N, N:M).
- [x] No orphaned tables.
- [x] Composite primary keys implemented where appropriate (Bookmarks, Opportunities).
- [x] Duplicate structures eliminated.
