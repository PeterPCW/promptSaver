# Output variable: DNS Name of ELB
# The following code defines an output variable named "elb_dns_name" that will be used to store the DNS name of an AWS Elastic Load Balancer (ELB).
# This output variable can be used in other parts of the Terraform code to reference the ELB's DNS name.

output "elb_dns_name" {

  # The "value" attribute specifies the value that will be assigned to the output variable.
  # In this case, the value is set to "${aws_elb.example.dns_name}", which references the DNS name of an AWS ELB named "example".
  # The syntax "${...}" is used to specify interpolations, which allow Terraform to dynamically compute the value of the attribute at runtime.
  # In this case, the interpolation is used to retrieve the DNS name of the ELB named "example".

  value = "${aws_elb.example.dns_name}"
}

// Source: https://github.com/alfonsof/terraform-aws-examples/blob/master/code/05-cluster-webserver/outputs.tf