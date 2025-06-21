provider "aws" {
  region = var.region
}

resource "aws_dynamodb_table" "event_store" {
  name         = "EventStore"
  billing_mode = "PAY_PER_REQUEST"

  hash_key  = "PK"
  range_key = "SK"

  attribute {
    name = "PK"
    type = "S"
  }

  attribute {
    name = "SK"
    type = "S"
  }

  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"

  tags = {
    Environment = var.environment
    Project     = "CRMEventSourced"
  }
}