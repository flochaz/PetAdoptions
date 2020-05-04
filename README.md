
### NOT USED

```
### Modify instance public access temporarily
aws rds modify-db-instance --db-instance-identifier ```DBInstanceID``` --publicly-accessible --apply-immediately

### Check instance modification status
aws rds describe-db-instances --db-instance-identifier ```DBInstanceID``` | grep DBInstanceStatus
```



## How to create an ElasticBeanstalk deployment package

[Instructions here](petsearch/README.md)