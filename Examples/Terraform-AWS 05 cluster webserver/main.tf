# Configure the AWS provider
provider "aws" {
  region = "eu-west-1"      # set the AWS region to be used
}

# Data source: query the list of availability zones
data "aws_availability_zones" "all" {}    # get the list of availability zones in the specified region

# Create a Security Group for an EC2 instance
resource "aws_security_group" "instance" {  # define a resource of type aws_security_group with name instance
  name = "terraform-example-instance"      # set the name of the security group

  ingress {                                # define inbound traffic rules
    from_port	  = "${var.server_port}"  # set the source port number for the traffic
    to_port		  = "${var.server_port}"  # set the destination port number for the traffic
    protocol	  = "tcp"                 # set the protocol for the traffic
    cidr_blocks	= ["0.0.0.0/0"]          # set the IP ranges from which the traffic is allowed
  }

  lifecycle {                              # define a lifecycle configuration for the resource
    create_before_destroy = true           # create a new resource before destroying the old one
  }
}

# Create a Security Group for an ELB
resource "aws_security_group" "elb" {      # define a resource of type aws_security_group with name elb
  name = "terraform-example-elb"           # set the name of the security group

  ingress {                                # define inbound traffic rules
    from_port	  = 80                    # set the source port number for the traffic
    to_port		  = 80                    # set the destination port number for the traffic
    protocol	  = "tcp"                 # set the protocol for the traffic
    cidr_blocks	= ["0.0.0.0/0"]          # set the IP ranges from which the traffic is allowed
  }

  egress {                                 # define outbound traffic rules
    from_port	  = 0                     # set the source port number for the traffic
    to_port		  = 0                     # set the destination port number for the traffic
    protocol	  = "-1"                  # set the protocol for the traffic
    cidr_blocks	= ["0.0.0.0/0"]          # set the IP ranges to which the traffic is allowed
  }
}

# Create a Launch Configuration
resource "aws_launch_configuration" "example" {   # define a resource of type aws_launch_configuration with name example
  image_id		    = "ami-785db401"            # set the ID of the AMI to use for the instance
  instance_type   = "t2.micro"                # set the type of the EC2 instance
  security_groups = ["${aws_security_group.instance.id}"]  # set the IDs of the security groups to associate with the instance

  user_data = <<-EOF                 # define the user data for the instance
              #!/bin/bash           # specify the shell to use for the script
              echo "Hello, World" > index.html   # create a file named index.html with the text "Hello, World"
              nohup busybox httpd -f -p "${var.server_port}" &   # start a web server with the specified port
              EOF

  lifecycle {                       # define a lifecycle configuration for the resource
    create_before_destroy = true    # create a new resource before destroying the old one
  }
}

# Create an Autoscaling Group
resource "aws_autoscaling_group" "example" { # Declare an autoscaling_group resource with name "example" and set launch configuration, availability zones, load balancers, health check type and tags
  launch_configuration = "${aws_launch_configuration.example.id}"
  availability_zones   = ["${data.aws_availability_zones.all.names}"]
  
  load_balancers       = ["${aws_elb.example.name}"]
  health_check_type    = "ELB"
  
  min_size = 2
  max_size = 10
  
  # Set tags for the autoscaling group
  tag {
    key                 = "Name"
    value               = "terraform-asg-example"
    propagate_at_launch = true
  }
}

# Create an ELB
resource "aws_elb" "example" { # Declare an elb resource with name "example" and set availability zones, security groups, listener block, and health check block
  name               = "terraform-asg-example"
  availability_zones = ["${data.aws_availability_zones.all.names}"]
  security_groups    = ["${aws_security_group.elb.id}"]
  
  # Set listener block for the elb resource
  listener {
    lb_port           = 80
    lb_protocol       = "http"
    instance_port     = "${var.server_port}"
    instance_protocol = "http"
  }
  
  # Set health check block for the elb resource
  health_check {
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 3
    interval            = 30
    target              = "HTTP:${var.server_port}/"
  }
}

// Source: https://github.com/alfonsof/terraform-aws-examples/blob/master/code/05-cluster-webserver/main.tf 