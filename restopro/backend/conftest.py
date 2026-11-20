import pytest
from rest_framework.test import APIClient

from apps.core import context
from tests.factories import make_company


@pytest.fixture(autouse=True)
def _clear_tenant():
    context.clear_tenant()
    yield
    context.clear_tenant()


@pytest.fixture
def api():
    return APIClient()


@pytest.fixture
def company_a(db):
    return make_company("A oshxona", "+998901110001")


@pytest.fixture
def company_b(db):
    return make_company("B kafe", "+998902220002")


def auth_client(user, branch=None):
    from apps.accounts.services import issue_tokens

    c = APIClient()
    c.credentials(HTTP_AUTHORIZATION=f"Bearer {issue_tokens(user)['access']}",
                  **({"HTTP_X_BRANCH_ID": str(branch.id)} if branch else {}))
    return c


@pytest.fixture
def owner_client_a(company_a):
    return auth_client(company_a.owner, company_a.branch)


@pytest.fixture
def owner_client_b(company_b):
    return auth_client(company_b.owner, company_b.branch)
