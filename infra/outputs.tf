output "event_store_table_name" {
  value = aws_dynamodb_table.event_store.name
}

output "projection_store_table_name" {
  value = aws_dynamodb_table.projection_store.name
}