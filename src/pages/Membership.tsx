<PlansContainer>
  <h1>选择会员方案</h1>
  <p>解锁全部高级功能，享受完整AI陪伴体验</p>
  
  <PlansGrid>
    {membershipPlans.map(plan => (
      <PlanCard key={plan.id} className={plan.featured ? 'featured' : ''}>
        {plan.featured && <PlanBadge>当前套餐</PlanBadge>}
        <h2>{plan.name}</h2>
        <PlanPrice>
          ${plan.price}<span>/月</span>
        </PlanPrice>
        <PlanFeatures>
          {plan.features.map(feature => (
            <li key={feature}>{feature}</li>
          ))}
        </PlanFeatures>
        <ActionButton className={plan.featured ? 'featured' : ''}>
          立即订阅
        </ActionButton>
      </PlanCard>
    ))}
  </PlansGrid>
</PlansContainer> 