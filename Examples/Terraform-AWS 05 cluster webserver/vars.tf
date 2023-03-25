# This block defines an input variable named "server_port" that will be used to configure the port that the server will use for HTTP requests.
variable "server_port" {
  description = "The port the server will use for HTTP requests"  # This line sets the description for the "server_port" variable.
  default = "8080"  # This line sets the default value for the "server_port" variable to "8080".
}

// Source: https://github.com/alfonsof/terraform-aws-examples/blob/master/code/05-cluster-webserver/vars.tf 