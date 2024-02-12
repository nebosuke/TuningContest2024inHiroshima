-- このファイルに記述されたSQLコマンドが、マイグレーション時に実行されます。

alter table user drop primary key, add column inc_id int primary key auto_increment, add constraint uk_user_1 unique(user_id), add index idx_user_1 (user_id), add index idx_user_2 (entry_date,kana), add index idx_user_3 (mail,password);

-- LIKE検索を高速化するため、全文検索インデックスを追加
alter table user add fulltext ft_user_1 (user_name) WITH PARSER ngram;
alter table user add fulltext ft_user_2 (kana) WITH PARSER ngram;
alter table user add fulltext ft_user_3 (mail) WITH PARSER ngram;
alter table user add fulltext ft_user_4 (goal) WITH PARSER ngram;

alter table department_role_member add index idx_department_role_member_1 (user_id,belong), add index idx_department_role_member_2 (role_id,belong);
alter table skill_member add index idx_skill_member_1 (user_id,skill_id);
alter table match_group_member add index idx_match_group_member_1 (user_id);
