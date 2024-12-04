# Topic
During the automation module where we learned how to automatically deploy and tear down our application we used cloudformation which I hadn't heard about before. I've always thought that Terraform was the only way to automatically deploy, update, and destroy aws resources. Thus, I wanted to research into the differences between cloudformation and terraform and why I should use one over the other.

## Overview of Terraform
Terraform is an Iac software tool created by Hashicorp. It allows you to define cloud resources in a human readable .tf file that can be used to create these resources, update them, and destroy them. 

Terraform achieves this by first going to the terraform provider and than hitting the target API's of these providers to create, update or destroy these resources with credentials that you provide. 

Terraform also supports providers outside of AWS such as  Azure, Google Cloud Platform, Kurbenetes, Helm, GitHub, Splunk, DataDog, and etc.

### Terraform workflow
When working with terraform or deploying infrastructure or code using terraform these are the 3 main commands that are ran to deploy your infrastructure.

`terraform refresh`:
Compares what terraform currently thinks our infrastructure looks like with that of the real world by querying them and if it is different terraform updates itself to match the real world

`terraform plan`:
Than terraform runs a plan that compares what the real world looks like to what we plan to execute or change in the real world. Based on these differences terraform makes plans to either create, update or destroy these resources.

`terraform apply`:
The final step of the terraform workflow is to enact the plan and build these changes in the real world so that it matches our plan.

`terraform destroy`:
This command is for when we want to take down our application. This automatically creates a destroy plan and applies it taking down all the resources that have been built through our terraform file.

### What does Terraform do well?
- **Multi-Cloud Support**: One of Terraform's standout features is its ability to work across multiple cloud providers, enabling a unified IaC approach.
- **State Management**: Terraform maintains a state file, allowing for tracking changes and ensuring consistency between the deployed resources and configuration files.
- **Extensibility**: The availability of custom providers and modules ensures flexibility and adaptability to specific needs.
- **Declarative Syntax**: The HCL language is easy to read as well as udnerstand.

### What does Terraform struggle with?
- **State File Complexity**: Managing state files can become challenging in large teams without proper practices (e.g., locking and storage in S3 with DynamoDB for consistency).
- **Learning Curve**: For teams already accustomed to AWS services, Terraform introduces a new language and workflow to learn.
- **Cost of Vendor Independence**: While multi-cloud support is beneficial, it may be unnecessary for organizations strictly using AWS, making Terraform's flexibility redundant.

### My personal experience with Terraform
My experience with terraform comes from the job I am currently at where I have had tolearn some terraform recently to make some deployments to AWS for the creation of new s3 buckets, SQS queues, and table references.

The initial learning curve for terraform was quite difficult for me with there not being a ton about where to start. Hashicorp has a tutorial but it only helped with understanding the surface level of how terraform worked and what it could do. I found that most of my information on how to use it came from asking coworkers about what certain keywords did and how to create certain objects. I also didn't know what a lot of the terraform was doing as a lot of it was broken up into modules stored in github repositories that were imported to the terraform file I was looking at.

However, after getting the hang of where stuff was and what each module did I found it extremely easy to build infrastructure for new applications that needed tables, lambdas, s3 buckets, and frontend deployment as all I needed to do was import modules that were already built and put in the parameters defined. This allowed for many of the people who just started there to build applications without a super deep knowledge of terraform.

I also found out that the terraform states which is what keeps track of the infrastructure currently deployed was stored in a centralized s3 bucket so that anyone who was working on code shared the same state. The lab also had 2 different aws accounts one for prod and one for stage which allowed for the same terraform file to be used on stage and prod to create resources with the same names so that the environemnts mirrored each other nearly exactly.


## Overview of CloudFormation and differences
Cloudformation is an Iac software tool developed by AWS to allow for customers to set up AWS resources through the use JSON or YAML files allowing for an easy way to deploy and tear down AWS resources.

Instead of a terraform state and module cloudformation stores its infrastructure in stacks which kind of combine the functionality of the 2. A cloudformation stack tracks what resources are made and groups the AWS resources defined in it as a single unit. You can also reuse these stacks in other stacks nesting them allowing for modularity similar to terraform. Also much like terraform cloudformation uses templates to define these resources and create, update, or delete them collectively by working with stacks. Stacks can be managed via the AWS console, API, or CLI. These stacks also tell AWS what resources need to be taken down when the stack is destroyed.

Also very similar to terraform's plan cloudformation has a change set which shows the potential impacts of your changes on the stack's resources. This is particularly useful for critical resources, as it allows you to plan and avoid unintentional disruptions (e.g., accidental replacement of a database). This differs in cloudformation's change set focuses on how the changes may affect your infrastructure such as downtime and possible data loss. Whie terraform focuses on the low-level changes such as attributes and configuration.

Also similar to terraform when you create or modify a stack, CloudFormation makes service calls to provision or configure resources based on your template. You must have appropriate AWS IAM permissions to perform these actions, such as creating or deleting EC2 instances.

The biggest major difference between terraform is that cloudformation only works with AWS resources and doesn't support other providers. However, this also means that cloudformation has all the most up to date functionality and service calls to AWS resources.

## Which one should you use
From what I have found on both Terraform and CloudFormation I can say both are powerful tools for managing infrastructure as code. Thus, if you plan to implement infrastructure as code I highly recommend that you use one of them as they heavily speed up deployment and testing of application from my own experience.

However, if I were to choose which one to use for an application it would heavily depend on what providers I plan to use. If I was just planning on just using AWS I would use cloudformation as its already built in to AWS and there is no need for terraform states to be centralized so everyone I'm working with could have access to them. However, if I plan on making an application that interacts with multiple providers I would use terraform as it supports 100s of providers and allows me to integrate all of them together in a singular workflow.