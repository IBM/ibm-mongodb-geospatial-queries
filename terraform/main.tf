terraform {
  required_providers {
     ibm = {
       version = "1.68.1"
       source  = "IBM-Cloud/ibm"
    }
  }
}

provider "ibm" {
  ibmcloud_api_key = var.ibmcloud_api_key
  region = var.region
}

resource "ibm_resource_group" "resource_group" {
  name = "mongogeoRG"
}
